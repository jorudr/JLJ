use std::sync::{
    atomic::{AtomicBool, Ordering},
    mpsc, Arc, Mutex,
};
use std::thread::{self, JoinHandle};
use std::time::{SystemTime, UNIX_EPOCH};

use base64::{engine::general_purpose, Engine as _};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::SampleFormat;
use serde::Serialize;

#[derive(Default)]
pub struct NativeAudioRecorder {
    worker: Mutex<Option<AudioWorker>>,
}

struct AudioWorker {
    command_tx: mpsc::Sender<AudioCommand>,
    result_rx: mpsc::Receiver<Result<NativeAudioResult, String>>,
    join_handle: Option<JoinHandle<()>>,
}

enum AudioCommand {
    Pause,
    Resume,
    Stop,
}

#[derive(Serialize)]
pub struct NativeAudioResult {
    pub data_url: String,
    pub mime_type: String,
    pub file_name: String,
}

#[tauri::command]
pub fn native_audio_start(state: tauri::State<NativeAudioRecorder>) -> Result<(), String> {
    stop_existing_worker(&state);

    let (command_tx, command_rx) = mpsc::channel();
    let (setup_tx, setup_rx) = mpsc::channel();
    let (result_tx, result_rx) = mpsc::channel();

    let join_handle = thread::spawn(move || {
        run_audio_worker(command_rx, setup_tx, result_tx);
    });

    setup_rx
        .recv()
        .map_err(|_| "Native_Audio_Setup_Channel_Closed".to_string())??;

    let mut worker = state.worker.lock().map_err(|_| "Recorder_Lock_Error")?;
    *worker = Some(AudioWorker {
        command_tx,
        result_rx,
        join_handle: Some(join_handle),
    });

    Ok(())
}

#[tauri::command]
pub fn native_audio_pause(state: tauri::State<NativeAudioRecorder>) -> Result<(), String> {
    send_worker_command(&state, AudioCommand::Pause)
}

#[tauri::command]
pub fn native_audio_resume(state: tauri::State<NativeAudioRecorder>) -> Result<(), String> {
    send_worker_command(&state, AudioCommand::Resume)
}

#[tauri::command]
pub fn native_audio_stop(
    state: tauri::State<NativeAudioRecorder>,
) -> Result<NativeAudioResult, String> {
    let worker = {
        let mut guard = state.worker.lock().map_err(|_| "Recorder_Lock_Error")?;
        guard
            .take()
            .ok_or_else(|| "No_Active_Recording".to_string())?
    };

    finish_worker(worker)
}

fn run_audio_worker(
    command_rx: mpsc::Receiver<AudioCommand>,
    setup_tx: mpsc::Sender<Result<(), String>>,
    result_tx: mpsc::Sender<Result<NativeAudioResult, String>>,
) {
    let setup = create_input_stream();
    let Ok((stream, samples, paused, sample_rate, channels)) = setup else {
        let _ = setup_tx.send(Err(setup
            .err()
            .unwrap_or_else(|| "Audio_Setup_Error".to_string())));
        return;
    };

    if let Err(error) = stream.play() {
        let _ = setup_tx.send(Err(format!("Input_Stream_Play_Error: {error}")));
        return;
    }

    let _ = setup_tx.send(Ok(()));

    while let Ok(command) = command_rx.recv() {
        match command {
            AudioCommand::Pause => paused.store(true, Ordering::Relaxed),
            AudioCommand::Resume => paused.store(false, Ordering::Relaxed),
            AudioCommand::Stop => {
                drop(stream);
                let result = build_audio_result(samples, sample_rate, channels);
                let _ = result_tx.send(result);
                return;
            }
        }
    }
}

type InputStreamParts = (
    cpal::Stream,
    Arc<Mutex<Vec<i16>>>,
    Arc<AtomicBool>,
    u32,
    u16,
);

fn create_input_stream() -> Result<InputStreamParts, String> {
    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .ok_or_else(|| "No_Input_Device".to_string())?;
    let supported_config = device
        .default_input_config()
        .map_err(|error| format!("Input_Config_Error: {error}"))?;

    let sample_format = supported_config.sample_format();
    let config: cpal::StreamConfig = supported_config.into();
    let samples = Arc::new(Mutex::new(Vec::<i16>::new()));
    let paused = Arc::new(AtomicBool::new(false));
    let err_fn = |error| eprintln!("native audio input stream error: {error}");

    let stream = match sample_format {
        SampleFormat::I16 => {
            let samples = Arc::clone(&samples);
            let paused = Arc::clone(&paused);
            device.build_input_stream(
                &config,
                move |data: &[i16], _| push_i16_samples(data, &samples, &paused),
                err_fn,
                None,
            )
        }
        SampleFormat::U16 => {
            let samples = Arc::clone(&samples);
            let paused = Arc::clone(&paused);
            device.build_input_stream(
                &config,
                move |data: &[u16], _| push_u16_samples(data, &samples, &paused),
                err_fn,
                None,
            )
        }
        SampleFormat::F32 => {
            let samples = Arc::clone(&samples);
            let paused = Arc::clone(&paused);
            device.build_input_stream(
                &config,
                move |data: &[f32], _| push_f32_samples(data, &samples, &paused),
                err_fn,
                None,
            )
        }
        _ => return Err("Unsupported_Input_Format".to_string()),
    }
    .map_err(|error| format!("Input_Stream_Error: {error}"))?;

    Ok((
        stream,
        samples,
        paused,
        config.sample_rate.0,
        config.channels,
    ))
}

fn send_worker_command(
    state: &tauri::State<NativeAudioRecorder>,
    command: AudioCommand,
) -> Result<(), String> {
    let worker = state.worker.lock().map_err(|_| "Recorder_Lock_Error")?;
    let worker = worker
        .as_ref()
        .ok_or_else(|| "No_Active_Recording".to_string())?;
    worker
        .command_tx
        .send(command)
        .map_err(|_| "Recorder_Command_Error".to_string())
}

fn stop_existing_worker(state: &tauri::State<NativeAudioRecorder>) {
    let worker = state.worker.lock().ok().and_then(|mut guard| guard.take());
    if let Some(worker) = worker {
        let _ = finish_worker(worker);
    }
}

fn finish_worker(mut worker: AudioWorker) -> Result<NativeAudioResult, String> {
    worker
        .command_tx
        .send(AudioCommand::Stop)
        .map_err(|_| "Recorder_Command_Error".to_string())?;

    let result = worker
        .result_rx
        .recv()
        .map_err(|_| "Recorder_Result_Error".to_string())?;

    if let Some(join_handle) = worker.join_handle.take() {
        let _ = join_handle.join();
    }

    result
}

fn build_audio_result(
    samples: Arc<Mutex<Vec<i16>>>,
    sample_rate: u32,
    channels: u16,
) -> Result<NativeAudioResult, String> {
    let samples = samples.lock().map_err(|_| "Recorder_Data_Error")?;
    let wav = encode_wav_pcm16(&samples, sample_rate, channels);
    let encoded = general_purpose::STANDARD.encode(wav);
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0);

    Ok(NativeAudioResult {
        data_url: format!("data:audio/wav;base64,{encoded}"),
        mime_type: "audio/wav".to_string(),
        file_name: format!("audio-note-{timestamp}.wav"),
    })
}

fn push_i16_samples(data: &[i16], samples: &Arc<Mutex<Vec<i16>>>, paused: &Arc<AtomicBool>) {
    if paused.load(Ordering::Relaxed) {
        return;
    }
    if let Ok(mut buffer) = samples.lock() {
        buffer.extend_from_slice(data);
    }
}

fn push_u16_samples(data: &[u16], samples: &Arc<Mutex<Vec<i16>>>, paused: &Arc<AtomicBool>) {
    if paused.load(Ordering::Relaxed) {
        return;
    }
    if let Ok(mut buffer) = samples.lock() {
        buffer.extend(data.iter().map(|sample| (*sample as i32 - 32768) as i16));
    }
}

fn push_f32_samples(data: &[f32], samples: &Arc<Mutex<Vec<i16>>>, paused: &Arc<AtomicBool>) {
    if paused.load(Ordering::Relaxed) {
        return;
    }
    if let Ok(mut buffer) = samples.lock() {
        buffer.extend(
            data.iter()
                .map(|sample| (sample.clamp(-1.0, 1.0) * i16::MAX as f32) as i16),
        );
    }
}

fn encode_wav_pcm16(samples: &[i16], sample_rate: u32, channels: u16) -> Vec<u8> {
    let data_len = samples.len() as u32 * 2;
    let byte_rate = sample_rate * channels as u32 * 2;
    let block_align = channels * 2;
    let mut bytes = Vec::with_capacity(44 + data_len as usize);

    bytes.extend_from_slice(b"RIFF");
    bytes.extend_from_slice(&(36 + data_len).to_le_bytes());
    bytes.extend_from_slice(b"WAVE");
    bytes.extend_from_slice(b"fmt ");
    bytes.extend_from_slice(&16u32.to_le_bytes());
    bytes.extend_from_slice(&1u16.to_le_bytes());
    bytes.extend_from_slice(&channels.to_le_bytes());
    bytes.extend_from_slice(&sample_rate.to_le_bytes());
    bytes.extend_from_slice(&byte_rate.to_le_bytes());
    bytes.extend_from_slice(&block_align.to_le_bytes());
    bytes.extend_from_slice(&16u16.to_le_bytes());
    bytes.extend_from_slice(b"data");
    bytes.extend_from_slice(&data_len.to_le_bytes());

    for sample in samples {
        bytes.extend_from_slice(&sample.to_le_bytes());
    }

    bytes
}
