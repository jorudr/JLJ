#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
from pathlib import Path
from tempfile import NamedTemporaryFile


DEFAULT_PATH = Path("public/data/myfxbook/statement1b99c459ef8c3510aecf4756d79373a3.csv")


def normalize_csv(path: Path) -> None:
    with path.open("r", encoding="utf-8", newline="") as source:
        rows = list(csv.reader(source, delimiter=",", quotechar='"'))

    with NamedTemporaryFile(
        "w",
        delete=False,
        encoding="utf-8",
        newline="",
        dir=str(path.parent),
        prefix=f".{path.name}.",
        suffix=".tmp",
    ) as tmp:
        writer = csv.writer(tmp, delimiter=",", quotechar='"', quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
        writer.writerows(rows)
        tmp_path = Path(tmp.name)

    tmp_path.replace(path)
    print(f"Normalized {path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Normalize myfxbook CSV files by parsing them with comma separators and rewriting them cleanly."
    )
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        default=[DEFAULT_PATH],
        help="CSV files to normalize. Defaults to the test file in public/data/myfxbook.",
    )
    args = parser.parse_args()

    for path in args.paths:
        normalize_csv(path)


if __name__ == "__main__":
    main()
