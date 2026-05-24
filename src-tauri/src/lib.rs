use tauri::Emitter;

mod audio_recorder;
mod benchmark;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(audio_recorder::NativeAudioRecorder::default())
        .manage(benchmark::BenchmarkState::default())
        .invoke_handler(tauri::generate_handler![
            audio_recorder::native_audio_start,
            audio_recorder::native_audio_pause,
            audio_recorder::native_audio_resume,
            audio_recorder::native_audio_stop,
            benchmark::get_benchmark_and_beta,
            benchmark::get_historical_curves
        ])
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            let _ = app.emit("single-instance", (args, cwd));
        }))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            app.handle().plugin(tauri_plugin_shell::init())?;
            app.handle().plugin(tauri_plugin_deep_link::init())?;
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;
            app.handle().plugin(tauri_plugin_dialog::init())?;
            app.handle().plugin(tauri_plugin_process::init())?;
            app.handle().plugin(tauri_plugin_fs::init())?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
