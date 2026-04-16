use std::sync::{Arc, Mutex};
use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;

// ── Worker state ─────────────────────────────────────────────────────────────

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct WorkerStatus {
    pub running: bool,
    pub pid: Option<u32>,
    pub error: Option<String>,
}

pub struct WorkerState {
    pub child: Option<CommandChild>,
}

impl WorkerState {
    pub fn new() -> Self {
        Self { child: None }
    }
}

type SharedWorker = Arc<Mutex<WorkerState>>;

// ── Tauri commands ────────────────────────────────────────────────────────────

/// Returns current FastAPI worker status.
#[tauri::command]
fn worker_status(state: tauri::State<SharedWorker>) -> WorkerStatus {
    let guard = state.lock().unwrap();
    match &guard.child {
        Some(_child) => WorkerStatus {
            running: true,
            // CommandChild pid access varies by platform — use None until confirmed alive
            pid: None,
            error: None,
        },
        None => WorkerStatus {
            running: false,
            pid: None,
            error: Some("Worker not started".to_string()),
        },
    }
}

/// Kills the current worker child and spawns a fresh one.
#[tauri::command]
async fn worker_restart(
    app: tauri::AppHandle,
    state: tauri::State<'_, SharedWorker>,
) -> Result<(), String> {
    let mut guard = state.lock().map_err(|e| e.to_string())?;
    // Kill existing child if present
    if let Some(child) = guard.child.take() {
        let _ = child.kill();
    }
    // Spawn new sidecar
    let (_, child) = app
        .shell()
        .sidecar("repoforge-worker")
        .map_err(|e| e.to_string())?
        .spawn()
        .map_err(|e| e.to_string())?;
    guard.child = Some(child);
    Ok(())
}

// ── App entry point ───────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let worker_state: SharedWorker = Arc::new(Mutex::new(WorkerState::new()));

    tauri::Builder::default()
        .manage(worker_state.clone())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .setup(move |app| {
            // ── Auto-start FastAPI worker sidecar ──
            match app
                .shell()
                .sidecar("repoforge-worker")
                .and_then(|cmd| cmd.spawn())
            {
                Ok((_, child)) => {
                    tracing::info!("repoforge-worker sidecar started");
                    if let Ok(mut guard) = worker_state.lock() {
                        guard.child = Some(child);
                    }
                }
                Err(e) => {
                    tracing::warn!("Could not start worker sidecar: {e}");
                    // Non-fatal — app continues, worker can be restarted from UI
                }
            }

            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            // Init tracing
            tracing_subscriber::fmt::init();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            worker_status,
            worker_restart,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
