use crate::asdf::executor::{run_asdf, run_asdf_streaming};
use crate::asdf::parser;
use crate::config::app_config;
use crate::error::AppError;
use crate::types::{CurrentVersion, InstallEvent, LatestInfo, SetScope};

fn get_config() -> (Option<String>, Option<String>) {
    let config = app_config::read_config().ok();
    let asdf_path = config.as_ref().and_then(|c| c.asdf_binary_path.clone());
    let cwd = config.as_ref().and_then(|c| c.working_directory.clone());
    (asdf_path, cwd)
}

#[tauri::command]
pub async fn current(name: Option<String>) -> Result<Vec<CurrentVersion>, AppError> {
    let (asdf_path, cwd) = get_config();
    let mut args = vec!["current"];
    if let Some(ref n) = name {
        args.push(n.as_str());
    }
    let output = run_asdf(&args, cwd.as_deref(), asdf_path.as_deref()).await?;
    parser::parse_current(&output.stdout)
}

#[tauri::command]
pub async fn install(
    name: Option<String>,
    version: Option<String>,
    keep_download: bool,
    cwd: Option<String>,
    on_output: tauri::ipc::Channel<InstallEvent>,
) -> Result<(), AppError> {
    let (asdf_path, default_cwd) = get_config();
    let effective_cwd = cwd.or(default_cwd);

    let mut args = vec!["install"];
    if let Some(ref n) = name {
        args.push(n.as_str());
    }
    if let Some(ref v) = version {
        args.push(v.as_str());
    }
    if keep_download {
        // Insert before the end — asdf supports --keep-download after install
        args.push("--keep-download");
    }

    run_asdf_streaming(
        &args,
        effective_cwd.as_deref(),
        asdf_path.as_deref(),
        &on_output,
    )
    .await
}

#[tauri::command]
pub async fn uninstall(name: String, version: String) -> Result<String, AppError> {
    let (asdf_path, _) = get_config();
    let output = run_asdf(&["uninstall", &name, &version], None, asdf_path.as_deref()).await?;
    Ok(output.stdout.trim().to_string())
}

#[tauri::command]
pub async fn set_version(
    name: String,
    versions: Vec<String>,
    scope: SetScope,
) -> Result<String, AppError> {
    let (asdf_path, cwd) = get_config();
    let mut args: Vec<String> = vec!["set".to_string()];

    match scope {
        SetScope::Home => args.push("--home".to_string()),
        SetScope::Parent => args.push("--parent".to_string()),
        SetScope::Local => {}
    }

    args.push(name);
    args.extend(versions);

    let args_ref: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
    let output = run_asdf(&args_ref, cwd.as_deref(), asdf_path.as_deref()).await?;
    Ok(output.stdout.trim().to_string())
}

#[tauri::command]
pub async fn latest(name: String, filter: Option<String>) -> Result<String, AppError> {
    let (asdf_path, _) = get_config();
    let mut args = vec!["latest", name.as_str()];
    if let Some(ref f) = filter {
        args.push(f.as_str());
    }
    let output = run_asdf(&args, None, asdf_path.as_deref()).await?;
    Ok(output.stdout.trim().to_string())
}

#[tauri::command]
pub async fn latest_all() -> Result<Vec<LatestInfo>, AppError> {
    let (asdf_path, _) = get_config();
    let output = run_asdf(&["latest", "--all"], None, asdf_path.as_deref()).await?;
    parser::parse_latest_all(&output.stdout)
}

#[tauri::command]
pub async fn list_installed(name: String) -> Result<Vec<String>, AppError> {
    let (asdf_path, _) = get_config();
    let output = run_asdf(&["list", &name], None, asdf_path.as_deref()).await?;
    Ok(parser::parse_list_installed(&output.stdout)
        .into_iter()
        .map(|(v, _)| v)
        .collect())
}

#[tauri::command]
pub async fn list_all(name: String, filter: Option<String>) -> Result<Vec<String>, AppError> {
    let (asdf_path, _) = get_config();
    let mut args = vec!["list", "all", name.as_str()];
    if let Some(ref f) = filter {
        args.push(f.as_str());
    }
    let output = run_asdf(&args, None, asdf_path.as_deref()).await?;
    Ok(parser::parse_list_all(&output.stdout))
}

#[tauri::command]
pub async fn where_installed(name: String, version: Option<String>) -> Result<String, AppError> {
    let (asdf_path, cwd) = get_config();
    let mut args = vec!["where", name.as_str()];
    if let Some(ref v) = version {
        args.push(v.as_str());
    }
    let output = run_asdf(&args, cwd.as_deref(), asdf_path.as_deref()).await?;
    Ok(output.stdout.trim().to_string())
}
