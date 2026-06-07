use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

const EXPORT_FILE_NAMES: [&str; 8] = [
    "exgenesis_trades.json",
    "exgenesis_trades.csv",
    "exgenesis_trades.htm",
    "exgenesis_trades.html",
    "jlj_trades.json",
    "jlj_trades.csv",
    "history_export.json",
    "history_export.csv",
];

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MetaTraderDetectedSource {
    id: String,
    platform: String,
    terminal_name: String,
    data_dir: String,
    export_file_path: String,
    export_file_name: String,
    modified_at_ms: Option<u64>,
}

#[tauri::command]
pub async fn detect_metatrader_sources() -> Result<Vec<MetaTraderDetectedSource>, String> {
    let mut sources = Vec::new();

    for root in candidate_roots() {
        if !root.exists() {
            continue;
        }

        collect_terminal_sources(&root, &mut sources);
    }

    sources.sort_by(|left, right| {
        right
            .modified_at_ms
            .unwrap_or(0)
            .cmp(&left.modified_at_ms.unwrap_or(0))
            .then_with(|| left.terminal_name.cmp(&right.terminal_name))
    });
    sources.dedup_by(|left, right| left.export_file_path == right.export_file_path);

    Ok(sources)
}

#[tauri::command]
pub async fn read_metatrader_export(export_file_path: String) -> Result<String, String> {
    fs::read_to_string(&export_file_path)
        .map_err(|error| format!("Failed to read MetaTrader export: {}", error))
}

fn candidate_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();

    if cfg!(target_os = "windows") {
        if let Ok(app_data) = std::env::var("APPDATA") {
            roots.push(PathBuf::from(app_data).join("MetaQuotes").join("Terminal"));
        }
    }

    if cfg!(target_os = "macos") {
        if let Ok(home) = std::env::var("HOME") {
            let library = PathBuf::from(home).join("Library").join("Application Support");
            roots.push(library.join("com.metaquotes.metatrader5").join("Bottles"));
            roots.push(library.join("com.metaquotes.metatrader4").join("Bottles"));
            roots.push(library.join("net.metaquotes.wine.metatrader5"));
            roots.push(library.join("net.metaquotes.wine.metatrader4"));
            roots.push(library.join("CrossOver").join("Bottles"));
        }
    }

    roots
}

fn collect_terminal_sources(root: &Path, sources: &mut Vec<MetaTraderDetectedSource>) {
    if root.file_name().and_then(|name| name.to_str()) == Some("Terminal") {
        scan_terminal_data_dir(root, sources);
        return;
    }

    if let Ok(entries) = fs::read_dir(root) {
        for entry in entries.flatten() {
            let path = entry.path();

            if path.is_dir() {
                if path.file_name().and_then(|name| name.to_str()) == Some("Terminal") {
                    scan_terminal_data_dir(&path, sources);
                } else {
                    collect_terminal_sources_limited(&path, sources, 0, 5);
                }
            }
        }
    }
}

fn collect_terminal_sources_limited(path: &Path, sources: &mut Vec<MetaTraderDetectedSource>, depth: usize, max_depth: usize) {
    if depth > max_depth {
        return;
    }

    if path.file_name().and_then(|name| name.to_str()) == Some("Terminal") {
        scan_terminal_data_dir(path, sources);
        return;
    }

    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let child = entry.path();
            if child.is_dir() {
                collect_terminal_sources_limited(&child, sources, depth + 1, max_depth);
            }
        }
    }
}

fn scan_terminal_data_dir(terminal_dir: &Path, sources: &mut Vec<MetaTraderDetectedSource>) {
    if let Ok(entries) = fs::read_dir(terminal_dir) {
        for entry in entries.flatten() {
            let profile_dir = entry.path();
            if !profile_dir.is_dir() {
                continue;
            }

            scan_profile_files(&profile_dir.join("MQL5").join("Files"), "MT5", &profile_dir, sources);
            scan_profile_files(&profile_dir.join("MQL4").join("Files"), "MT4", &profile_dir, sources);
        }
    }
}

fn scan_profile_files(files_dir: &Path, platform: &str, profile_dir: &Path, sources: &mut Vec<MetaTraderDetectedSource>) {
    if !files_dir.exists() {
        return;
    }

    for file_name in EXPORT_FILE_NAMES {
        let export_path = files_dir.join(file_name);
        if !export_path.exists() || !export_path.is_file() {
            continue;
        }

        let modified_at_ms = fs::metadata(&export_path)
            .ok()
            .and_then(|metadata| metadata.modified().ok())
            .and_then(|modified| modified.duration_since(UNIX_EPOCH).ok())
            .map(|duration| duration.as_millis() as u64);

        let terminal_name = profile_dir
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or(platform)
            .to_string();

        let export_file_path = export_path.to_string_lossy().to_string();
        sources.push(MetaTraderDetectedSource {
            id: format!("{}:{}", platform, export_file_path),
            platform: platform.to_string(),
            terminal_name,
            data_dir: profile_dir.to_string_lossy().to_string(),
            export_file_path: export_file_path.clone(),
            export_file_name: file_name.to_string(),
            modified_at_ms,
        });
    }
}
