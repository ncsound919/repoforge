# FastAPI Worker Sidecar

RepoForge bundles the FastAPI worker as a Tauri **sidecar binary**, so users
never need to start it manually in a separate terminal.

## How it works

1. At app startup, `lib.rs` calls `app.shell().sidecar("repoforge-worker").spawn()`.
2. The spawned process is stored in `SharedWorker` (an `Arc<Mutex<WorkerState>>`).
3. The frontend's `WorkerStatusBar` polls `invoke("worker_status")` every 8 s.
4. If the worker crashes, users can click the **↺** button in the status bar to
   call `invoke("worker_restart")`.

## Building the sidecar

Tauri expects the worker binary at:

```
src-tauri/binaries/repoforge-worker-<target-triple>
```

For example on Linux x86-64:

```
src-tauri/binaries/repoforge-worker-x86_64-unknown-linux-gnu
```

Build your FastAPI worker with PyInstaller or Nuitka and copy the output:

```bash
# From the worker/ directory
pyinstaller worker/main.py --onefile --name repoforge-worker
cp dist/repoforge-worker ../src-tauri/binaries/repoforge-worker-$(rustc -vV | sed -n 's/host: //p')
```

## Capability permissions

`src-tauri/capabilities/main.json` grants `shell:allow-spawn` so Tauri's
security model permits the sidecar launch. All other app permissions are
also declared there.

## Environment variables passed to worker

The sidecar inherits the app's environment. Set `REPOFORGE_DB_URL`,
`REPOFORGE_LOG_LEVEL`, etc. in your shell before launching the app during
development, or package them via `.env` loaded in the setup closure.
