#!/usr/bin/env python3
"""Small JSON bridge around the official MetaTrader5 Python package.

The desktop application starts this script for one request at a time. Keeping
the bridge stateless makes the Tauri side easy to package and prevents account
credentials from being put in process arguments or persisted on disk.

Install the dependency in the Python environment selected by MT5_PYTHON:

    python -m pip install MetaTrader5
"""

from __future__ import annotations

import json
import os
import sys
from datetime import date, datetime, timezone
from typing import Any


class Mt5ServiceError(RuntimeError):
    """An error that can be shown safely to the desktop client."""


def serialize(value: Any) -> Any:
    """Convert namedtuples, numpy values and datetime objects to JSON data."""

    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(key): serialize(item) for key, item in value.items()}
    if hasattr(value, "_asdict"):
        return serialize(value._asdict())
    field_names = getattr(getattr(value, "dtype", None), "names", None)
    if field_names:
        return [
            {name: serialize(item) for name, item in zip(field_names, row)}
            for row in value
        ]
    if isinstance(value, (list, tuple)):
        return [serialize(item) for item in value]
    if hasattr(value, "tolist"):
        return serialize(value.tolist())
    if hasattr(value, "item"):
        return serialize(value.item())
    return str(value)


def parameter(params: dict[str, Any], *names: str, default: Any = None) -> Any:
    for name in names:
        if name in params and params[name] is not None:
            return params[name]
    return default


def parse_datetime(value: Any) -> datetime:
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, tz=timezone.utc)
    if not isinstance(value, str) or not value.strip():
        raise Mt5ServiceError("A valid date/time value is required")

    normalized = value.strip().replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError as error:
        raise Mt5ServiceError(f"Invalid date/time value: {value}") from error


def timeframe(mt5: Any, value: Any) -> Any:
    if isinstance(value, int):
        return value
    if not isinstance(value, str) or not value.strip():
        raise Mt5ServiceError("A timeframe is required, for example M1 or H1")

    name = value.upper().strip()
    if not name.startswith("TIMEFRAME_"):
        name = f"TIMEFRAME_{name}"
    resolved = getattr(mt5, name, None)
    if resolved is None:
        raise Mt5ServiceError(f"Unsupported MetaTrader 5 timeframe: {value}")
    return resolved


def require_result(mt5: Any, result: Any, operation: str) -> Any:
    if result is None or result is False:
        error = serialize(mt5.last_error())
        raise Mt5ServiceError(f"{operation} failed: {error}")
    return result


def connection_options(connection: dict[str, Any]) -> dict[str, Any]:
    options: dict[str, Any] = {}
    path = parameter(connection, "path")
    login = parameter(connection, "login")
    password = parameter(connection, "password")
    server = parameter(connection, "server")
    timeout = parameter(connection, "timeout", default=60_000)
    portable = parameter(connection, "portable")

    if path:
        options["path"] = path
    if login is not None and login != "":
        options["login"] = int(login)
    if password is not None:
        options["password"] = password
    if server:
        options["server"] = server
    if timeout is not None:
        options["timeout"] = int(timeout)
    if portable is not None:
        options["portable"] = bool(portable)
    return options


def load_mt5(connection: dict[str, Any]) -> Any:
    try:
        import MetaTrader5 as mt5
    except ImportError as error:
        if sys.platform != "win32":
            raise Mt5ServiceError(
                "Пакет MetaTrader5 поддерживается только на Windows x64. "
                f"Текущая ОС/Python: {sys.executable} ({sys.platform}). "
                "Запустите приложение на ОС Windows."
            ) from error
        raise Mt5ServiceError(
            "Пакет MetaTrader5 не установлен в выбранной среде Python. "
            f"Установите его командой: \"{sys.executable}\" -m pip install MetaTrader5"
        ) from error

    return mt5, mt5.shutdown


def connect(mt5: Any, connection: dict[str, Any]) -> None:
    options = connection_options(connection)
    if not mt5.initialize(**options):
        raise Mt5ServiceError(f"MetaTrader 5 initialization failed: {serialize(mt5.last_error())}")


def query(mt5: Any, action: str, params: dict[str, Any]) -> Any:
    if action in {"connect", "status"}:
        return {
            "connected": True,
            "terminalInfo": serialize(mt5.terminal_info()),
            "version": serialize(mt5.version()),
            "accountInfo": serialize(mt5.account_info()),
        }
    if action == "shutdown":
        return {"connected": False}
    if action == "version":
        return serialize(mt5.version())
    if action == "terminal_info":
        return serialize(require_result(mt5, mt5.terminal_info(), action))
    if action == "account_info":
        return serialize(require_result(mt5, mt5.account_info(), action))
    if action == "symbols_total":
        return mt5.symbols_total()
    if action == "symbols_get":
        group = parameter(params, "group")
        result = mt5.symbols_get() if group is None else mt5.symbols_get(group=group)
        return serialize(require_result(mt5, result, action))
    if action == "symbol_info":
        symbol = parameter(params, "symbol")
        return serialize(require_result(mt5, mt5.symbol_info(symbol), action))
    if action == "symbol_info_tick":
        symbol = parameter(params, "symbol")
        return serialize(require_result(mt5, mt5.symbol_info_tick(symbol), action))
    if action == "symbol_select":
        symbol = parameter(params, "symbol")
        selected = bool(parameter(params, "selected", default=True))
        return require_result(mt5, mt5.symbol_select(symbol, selected), action)
    if action == "copy_rates_from_pos":
        result = mt5.copy_rates_from_pos(
            parameter(params, "symbol"),
            timeframe(mt5, parameter(params, "timeframe")),
            int(parameter(params, "startPos", "start_pos", default=0)),
            int(parameter(params, "count", default=100)),
        )
        return serialize(require_result(mt5, result, action))
    if action == "copy_rates_from":
        result = mt5.copy_rates_from(
            parameter(params, "symbol"),
            timeframe(mt5, parameter(params, "timeframe")),
            parse_datetime(parameter(params, "dateFrom", "date_from")),
            int(parameter(params, "count", default=100)),
        )
        return serialize(require_result(mt5, result, action))
    if action == "copy_rates_range":
        result = mt5.copy_rates_range(
            parameter(params, "symbol"),
            timeframe(mt5, parameter(params, "timeframe")),
            parse_datetime(parameter(params, "dateFrom", "date_from")),
            parse_datetime(parameter(params, "dateTo", "date_to")),
        )
        return serialize(require_result(mt5, result, action))
    if action == "copy_ticks_from":
        flags = int(parameter(params, "flags", default=mt5.COPY_TICKS_ALL))
        result = mt5.copy_ticks_from(
            parameter(params, "symbol"),
            parse_datetime(parameter(params, "dateFrom", "date_from")),
            int(parameter(params, "count", default=1000)),
            flags,
        )
        return serialize(require_result(mt5, result, action))
    if action == "copy_ticks_range":
        flags = int(parameter(params, "flags", default=mt5.COPY_TICKS_ALL))
        result = mt5.copy_ticks_range(
            parameter(params, "symbol"),
            parse_datetime(parameter(params, "dateFrom", "date_from")),
            parse_datetime(parameter(params, "dateTo", "date_to")),
            flags,
        )
        return serialize(require_result(mt5, result, action))
    if action in {"positions_get", "orders_get"}:
        getter = getattr(mt5, action)
        kwargs: dict[str, Any] = {}
        for key in ("symbol", "group", "ticket"):
            value = parameter(params, key)
            if value is not None:
                kwargs[key] = int(value) if key == "ticket" else value
        return serialize(require_result(mt5, getter(**kwargs), action))
    if action in {"history_orders_get", "history_deals_get"}:
        getter = getattr(mt5, action)
        ticket = parameter(params, "ticket")
        position = parameter(params, "position")
        if ticket is not None:
            result = getter(ticket=int(ticket))
        elif position is not None:
            result = getter(position=int(position))
        else:
            result = getter(
                date_from=parse_datetime(parameter(params, "dateFrom", "date_from")),
                date_to=parse_datetime(parameter(params, "dateTo", "date_to")),
            )
        return serialize(require_result(mt5, result, action))
    if action == "order_calc_margin":
        result = mt5.order_calc_margin(
            int(parameter(params, "orderType", "order_type")),
            parameter(params, "symbol"),
            float(parameter(params, "volume")),
            float(parameter(params, "price")),
        )
        return require_result(mt5, result, action)
    if action == "order_calc_profit":
        result = mt5.order_calc_profit(
            int(parameter(params, "orderType", "order_type")),
            parameter(params, "symbol"),
            float(parameter(params, "volume")),
            float(parameter(params, "priceOpen", "price_open")),
            float(parameter(params, "priceClose", "price_close")),
        )
        return require_result(mt5, result, action)
    if action in {"order_check", "order_send"}:
        request = parameter(params, "request")
        if not isinstance(request, dict) or not request:
            raise Mt5ServiceError(f"{action} requires a non-empty request object")
        result = getattr(mt5, action)(request)
        return serialize(require_result(mt5, result, action))

    raise Mt5ServiceError(f"Unsupported MetaTrader 5 action: {action}")


def find_mac_wine_trade_files():
    home = os.path.expanduser("~")
    patterns = [
        os.path.join(home, "Library/Application Support/net.metaquotes.wine.metatrader5/Terminal/Common/Files/trades.json"),
        os.path.join(home, "Library/Application Support/net.metaquotes.wine.metatrader5/drive_c/users/*/AppData/Roaming/MetaQuotes/Terminal/Common/Files/trades.json"),
        os.path.join(home, "Library/Application Support/com.metaquotes.metatrader5/netdrive/Terminal/Common/Files/trades.json"),
        os.path.join(home, ".wine/drive_c/users/*/AppData/Roaming/MetaQuotes/Terminal/Common/Files/trades.json"),
        "./trades.json",
        "./mt5_auto_export.json"
    ]
    found_files = []
    import glob
    for p in patterns:
        if "*" in p:
            found_files.extend(glob.glob(p))
        elif os.path.exists(p):
            found_files.append(p)
    return found_files


def get_advisor_source_files() -> list[tuple[str, str]]:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    search_dirs = [
        os.getcwd(),
        script_dir,
        os.path.abspath(os.path.join(script_dir, "..")),
        os.path.abspath(os.path.join(script_dir, "..", "..")),
        os.path.abspath(os.path.join(script_dir, "..", "..", "..")),
        os.path.abspath(os.path.join(script_dir, "..", "..", "..", "..")),
        "/Users/evanvosh/Documents/app1.1"
    ]
    
    local_files = ["ExportTrades.mq5", "ExportTrades.ex5"]
    source_files = []
    for fname in local_files:
        for d in search_dirs:
            candidate = os.path.join(d, fname)
            if os.path.exists(candidate):
                source_files.append((fname, candidate))
                break
    return source_files


def install_advisor(target_os: str = "mac") -> dict[str, Any]:
    import shutil
    import glob
    home = os.path.expanduser("~")
    
    source_files = get_advisor_source_files()
    if not source_files:
        raise Mt5ServiceError("Исходные файлы советника ExportTrades не найдены.")

    mql5_dirs = []
    if target_os == "win" or sys.platform == "win32":
        pf_list = [
            os.environ.get("ProgramFiles", "C:\\Program Files"),
            os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)"),
            os.path.expanduser("~\\AppData\\Local\\Programs"),
            os.path.expanduser("~\\AppData\\Roaming\\MetaQuotes\\Terminal")
        ]
        for pf in pf_list:
            if os.path.exists(pf):
                matches = glob.glob(os.path.join(pf, "**", "MQL5"), recursive=True)
                for m in matches:
                    mql5_dirs.extend([os.path.join(m, "Experts"), os.path.join(m, "Experts", "Advisors"), os.path.join(m, "Indicators")])

    base_dirs = [
        os.path.join(home, "Library/Application Support/net.metaquotes.wine.metatrader5/drive_c/Program Files/MetaTrader 5/MQL5"),
        os.path.join(home, "Library/Application Support/com.metaquotes.metatrader5/netdrive/MQL5"),
        os.path.join(home, ".wine/drive_c/Program Files/MetaTrader 5/MQL5")
    ]
    appdata_glob = os.path.join(home, "Library/Application Support/net.metaquotes.wine.metatrader5/drive_c/users/*/AppData/Roaming/MetaQuotes/Terminal/*/MQL5")
    base_dirs.extend(glob.glob(appdata_glob))

    for b in base_dirs:
        if os.path.exists(b):
            mql5_dirs.extend([os.path.join(b, "Experts"), os.path.join(b, "Experts/Advisors"), os.path.join(b, "Indicators")])

    mql5_dirs = list(set([p for p in mql5_dirs if os.path.exists(os.path.dirname(p))]))
    if not mql5_dirs:
        raise Mt5ServiceError("Не удалось автоматически найти папку MetaTrader 5 на этом ПК.")

    copied_count = 0
    for target_dir in mql5_dirs:
        os.makedirs(target_dir, exist_ok=True)
        for fname, src_path in source_files:
            try:
                shutil.copy2(src_path, os.path.join(target_dir, fname))
                copied_count += 1
            except Exception:
                pass

    if copied_count == 0:
        raise Mt5ServiceError("Не удалось скопировать файлы советника в папки MT5.")

    return {"installed": True, "copiedCount": copied_count, "message": "Советник ExportTrades успешно установлен в MT5!"}


def download_desktop() -> dict[str, Any]:
    import shutil
    home = os.path.expanduser("~")
    desktop_dir = os.path.join(home, "Desktop")
    if not os.path.exists(desktop_dir):
        desktop_dir = home

    source_files = get_advisor_source_files()
    copied = []
    for fname, src_path in source_files:
        dst = os.path.join(desktop_dir, fname)
        try:
            shutil.copy2(src_path, dst)
            copied.append(dst)
        except Exception:
            pass

    if not copied:
        raise Mt5ServiceError("Не удалось скопировать файлы советника на Рабочий Стол.")

    return {"downloaded": True, "copied": copied, "message": "Файлы советника ExportTrades успешно скопированы на ваш Рабочий Стол (Desktop)!"}


def mac_wine_query(action: str, connection: dict[str, Any], params: dict[str, Any]) -> Any:
    if action == "install_advisor":
        target_os = str(params.get("targetOs") or "mac")
        return install_advisor(target_os)

    if action == "download_desktop":
        return download_desktop()

    if action in {"connect", "status"}:
        return {
            "connected": True,
            "terminalInfo": {"name": "MetaTrader 5 (macOS Wine)", "community_account": True},
            "version": [5, 0, 4500],
            "accountInfo": {
                "login": connection.get("login") or 0,
                "server": connection.get("server") or "Wine-MT5",
                "currency": "USD"
            }
        }
    if action == "shutdown":
        return {"connected": False}

    if action in {"history_deals_get", "history_orders_get", "positions_get"}:
        files = find_mac_wine_trade_files()
        if not files:
            raise Mt5ServiceError(
                "Файл сделок trades.json не найден. Убедитесь, что в MT5 на графике запущен эксперт ExportTrades."
            )
        try:
            with open(files[0], "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    if action in {"history_deals_get", "history_orders_get"}:
                        return data.get("deals", [])
                    if action == "positions_get":
                        return data.get("positions", [])
                    return data.get("deals") or data.get("positions") or []
                if isinstance(data, list):
                    return data
                return []
        except Exception as err:
            raise Mt5ServiceError(f"Ошибка при чтении сделок из MT5: {err}")

    raise Mt5ServiceError(f"Действие {action} поддерживается на Mac через экспорт ExportTrades.mq5.")


def main() -> int:
    try:
        payload = json.load(sys.stdin)
        action = payload.get("action")
        if not isinstance(action, str) or not action:
            raise Mt5ServiceError("The action field is required")
        connection = payload.get("connection") or {}
        params = payload.get("params") or {}
        if not isinstance(connection, dict) or not isinstance(params, dict):
            raise Mt5ServiceError("connection and params must be JSON objects")

        if action == "shutdown":
            print(json.dumps({"ok": True, "data": {"connected": False}}), flush=True)
            return 0

        if sys.platform != "win32":
            result = mac_wine_query(action, connection, params)
            print(json.dumps({"ok": True, "data": serialize(result)}, ensure_ascii=False), flush=True)
            return 0

        mt5, shutdown_mt5 = load_mt5(connection)
        connect(mt5, connection)
        result = query(mt5, action, params)
        print(json.dumps({"ok": True, "data": serialize(result)}, ensure_ascii=False), flush=True)
        return 0
    except Exception as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False), flush=True)
        return 1
    finally:
        try:
            if "shutdown_mt5" in locals():
                shutdown_mt5()
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
