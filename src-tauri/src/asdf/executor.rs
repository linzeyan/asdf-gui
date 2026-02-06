use std::path::PathBuf;
use std::sync::OnceLock;

use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

use crate::error::AppError;
use crate::types::InstallEvent;

#[derive(Debug)]
pub struct CommandOutput {
    pub stdout: String,
    #[allow(dead_code)]
    pub stderr: String,
    #[allow(dead_code)]
    pub exit_code: i32,
}

/// Cache the user's login-shell PATH so we only resolve it once.
static SHELL_PATH: OnceLock<String> = OnceLock::new();

/// Get the user's full PATH by invoking their login shell.
/// Tauri apps launched from Finder/Dock inherit a minimal PATH
/// (/usr/bin:/bin:/usr/sbin:/sbin), so we need the real one.
fn get_user_path() -> &'static str {
    SHELL_PATH.get_or_init(|| {
        // Try the user's SHELL, fallback to /bin/zsh (macOS default), then /bin/bash
        let shells = [
            std::env::var("SHELL").unwrap_or_default(),
            "/bin/zsh".to_string(),
            "/bin/bash".to_string(),
        ];

        for shell in &shells {
            if shell.is_empty() {
                continue;
            }
            if let Ok(output) = std::process::Command::new(shell)
                .args(["-lc", "echo $PATH"])
                .output()
                && output.status.success()
            {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() {
                    return path;
                }
            }
        }

        // Last resort: return the current (minimal) PATH
        std::env::var("PATH").unwrap_or_default()
    })
}

/// Well-known asdf installation directories to check as fallback.
fn well_known_asdf_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    if let Some(home) = dirs::home_dir() {
        paths.push(home.join(".asdf").join("bin").join("asdf"));
    }
    // Homebrew on Apple Silicon
    paths.push(PathBuf::from("/opt/homebrew/bin/asdf"));
    // Homebrew on Intel Mac
    paths.push(PathBuf::from("/usr/local/bin/asdf"));
    // Some Linux package managers
    paths.push(PathBuf::from("/opt/asdf-vm/bin/asdf"));
    paths
}

/// Resolve the asdf binary path.
/// Priority: user config override > $ASDF_DIR/bin/asdf > well-known paths
///         > user shell PATH lookup > Windows `where`.
pub fn resolve_asdf_binary(config_override: Option<&str>) -> Result<PathBuf, AppError> {
    if let Some(path) = config_override {
        let p = PathBuf::from(path);
        if p.exists() {
            return Ok(p);
        }
        return Err(AppError::AsdfNotFound(format!(
            "configured path does not exist: {path}"
        )));
    }

    if let Ok(asdf_dir) = std::env::var("ASDF_DIR") {
        let p = PathBuf::from(&asdf_dir).join("bin").join("asdf");
        if p.exists() {
            return Ok(p);
        }
    }

    // Check well-known installation paths
    for p in well_known_asdf_paths() {
        if p.exists() {
            return Ok(p);
        }
    }

    // Fallback: look up asdf using the user's full login-shell PATH
    let user_path = get_user_path();
    if let Ok(output) = std::process::Command::new("which")
        .arg("asdf")
        .env("PATH", user_path)
        .output()
        && output.status.success()
    {
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !path.is_empty() {
            return Ok(PathBuf::from(path));
        }
    }

    // On Windows, try `where` instead of `which`
    if cfg!(target_os = "windows")
        && let Ok(output) = std::process::Command::new("where").arg("asdf").output()
        && output.status.success()
    {
        let path = String::from_utf8_lossy(&output.stdout)
            .lines()
            .next()
            .unwrap_or("")
            .trim()
            .to_string();
        if !path.is_empty() {
            return Ok(PathBuf::from(path));
        }
    }

    Err(AppError::AsdfNotFound(
        "asdf binary not found in PATH, $ASDF_DIR, or config".to_string(),
    ))
}

/// Execute an asdf subcommand and capture all output.
pub async fn run_asdf(
    args: &[&str],
    cwd: Option<&str>,
    asdf_path: Option<&str>,
) -> Result<CommandOutput, AppError> {
    let binary = resolve_asdf_binary(asdf_path)?;
    let mut cmd = Command::new(&binary);
    cmd.args(args);
    cmd.env("PATH", get_user_path());

    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }

    let output = cmd
        .output()
        .await
        .map_err(|e| AppError::ProcessError(e.to_string()))?;

    let exit_code = output.status.code().unwrap_or(-1);
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if exit_code != 0 {
        return Err(AppError::AsdfError {
            exit_code,
            stderr: stderr.trim().to_string(),
        });
    }

    Ok(CommandOutput {
        stdout,
        stderr,
        exit_code,
    })
}

/// Streaming variant for long-running commands (install, update).
/// Sends each line of stdout/stderr to the frontend via Tauri Channel.
pub async fn run_asdf_streaming(
    args: &[&str],
    cwd: Option<&str>,
    asdf_path: Option<&str>,
    channel: &tauri::ipc::Channel<InstallEvent>,
) -> Result<(), AppError> {
    use std::process::Stdio;

    let binary = resolve_asdf_binary(asdf_path)?;
    let mut cmd = Command::new(&binary);
    cmd.args(args);
    cmd.env("PATH", get_user_path());
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }

    let mut child = cmd
        .spawn()
        .map_err(|e| AppError::ProcessError(e.to_string()))?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    let channel_out = channel.clone();
    let stdout_handle = tokio::spawn(async move {
        if let Some(stdout) = stdout {
            let mut reader = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let _ = channel_out.send(InstallEvent::Stdout(line));
            }
        }
    });

    let channel_err = channel.clone();
    let stderr_handle = tokio::spawn(async move {
        if let Some(stderr) = stderr {
            let mut reader = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let _ = channel_err.send(InstallEvent::Stderr(line));
            }
        }
    });

    let _ = stdout_handle.await;
    let _ = stderr_handle.await;

    let status = child
        .wait()
        .await
        .map_err(|e| AppError::ProcessError(e.to_string()))?;

    let success = status.success();
    let _ = channel.send(InstallEvent::Finished { success });

    if !success {
        return Err(AppError::AsdfError {
            exit_code: status.code().unwrap_or(-1),
            stderr: "install failed (see log output above)".to_string(),
        });
    }

    Ok(())
}
