use crate::asdf::executor::run_asdf;
use crate::asdf::parser;
use crate::config::app_config;
use crate::error::AppError;
use crate::types::{AsdfInfo, EnvVar};

#[tauri::command]
pub async fn asdf_version() -> Result<String, AppError> {
    let config = app_config::read_config().ok();
    let asdf_path = config.as_ref().and_then(|c| c.asdf_binary_path.as_deref());

    let output = run_asdf(&["version"], None, asdf_path).await?;
    Ok(output.stdout.trim().to_string())
}

#[tauri::command]
pub async fn asdf_info() -> Result<AsdfInfo, AppError> {
    let config = app_config::read_config().ok();
    let asdf_path = config.as_ref().and_then(|c| c.asdf_binary_path.as_deref());

    let output = run_asdf(&["info"], None, asdf_path).await?;
    parse_asdf_info(&output.stdout)
}

#[tauri::command]
pub async fn asdf_env(command: String) -> Result<Vec<EnvVar>, AppError> {
    let config = app_config::read_config().ok();
    let asdf_path = config.as_ref().and_then(|c| c.asdf_binary_path.as_deref());
    let cwd = config.as_ref().and_then(|c| c.working_directory.as_deref());

    let output = run_asdf(&["env", &command], cwd, asdf_path).await?;
    Ok(parser::parse_env(&output.stdout))
}

fn parse_asdf_info(stdout: &str) -> Result<AsdfInfo, AppError> {
    let mut version = String::new();
    let mut os = String::new();
    let mut shell = String::new();
    let mut asdf_dir = String::new();
    let mut asdf_data_dir = String::new();
    let mut plugins = Vec::new();

    let mut in_plugins = false;

    for line in stdout.lines() {
        let line = line.trim();

        if let Some(val) = line.strip_prefix("ASDF VERSION:") {
            version = val.trim().to_string();
            in_plugins = false;
        } else if let Some(val) = line.strip_prefix("OS:") {
            os = val.trim().to_string();
            in_plugins = false;
        } else if let Some(val) = line.strip_prefix("SHELL:") {
            shell = val.trim().to_string();
            in_plugins = false;
        } else if let Some(val) = line.strip_prefix("ASDF DIR:") {
            asdf_dir = val.trim().to_string();
            in_plugins = false;
        } else if let Some(val) = line.strip_prefix("ASDF DATA DIR:") {
            asdf_data_dir = val.trim().to_string();
            in_plugins = false;
        } else if line.starts_with("ASDF INSTALLED PLUGINS:") {
            in_plugins = true;
        } else if in_plugins && !line.is_empty() {
            plugins.push(line.to_string());
        } else if line.is_empty() {
            in_plugins = false;
        }
    }

    Ok(AsdfInfo {
        version,
        os,
        shell,
        asdf_dir,
        asdf_data_dir,
        plugins,
    })
}
