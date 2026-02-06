use crate::asdf::executor::run_asdf;
use crate::asdf::parser;
use crate::config::app_config;
use crate::error::AppError;
use crate::types::ShimVersion;

fn get_config() -> (Option<String>, Option<String>) {
    let config = app_config::read_config().ok();
    let asdf_path = config.as_ref().and_then(|c| c.asdf_binary_path.clone());
    let cwd = config.as_ref().and_then(|c| c.working_directory.clone());
    (asdf_path, cwd)
}

#[tauri::command]
pub async fn which_command(command: String) -> Result<String, AppError> {
    let (asdf_path, cwd) = get_config();
    let output = run_asdf(&["which", &command], cwd.as_deref(), asdf_path.as_deref()).await?;
    Ok(output.stdout.trim().to_string())
}

#[tauri::command]
pub async fn shim_versions(command: String) -> Result<Vec<ShimVersion>, AppError> {
    let (asdf_path, _) = get_config();
    let output = run_asdf(&["shimversions", &command], None, asdf_path.as_deref()).await?;
    Ok(parser::parse_shim_versions(&output.stdout))
}

#[tauri::command]
pub async fn reshim(name: String, version: String) -> Result<String, AppError> {
    let (asdf_path, _) = get_config();
    let output = run_asdf(&["reshim", &name, &version], None, asdf_path.as_deref()).await?;
    Ok(output.stdout.trim().to_string())
}
