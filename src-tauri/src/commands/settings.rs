use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::config::app_config;
use crate::config::app_config::{AppConfig, RecentProject};
use crate::config::context::MAX_RECENT_PROJECTS;
use crate::error::AppError;

#[tauri::command]
pub async fn read_config() -> Result<AppConfig, AppError> {
    app_config::read_config()
}

#[tauri::command]
pub async fn write_config(config: AppConfig) -> Result<(), AppError> {
    app_config::write_config(&config)
}

#[tauri::command]
pub async fn set_working_directory(path: String) -> Result<AppConfig, AppError> {
    let mut config = app_config::read_config()?;
    config.working_directory = Some(path.clone());

    // Update recent_projects: remove if exists, then prepend
    config.recent_projects.retain(|p| p.path != path);

    let name = PathBuf::from(&path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.clone());

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    config.recent_projects.insert(
        0,
        RecentProject {
            path,
            name,
            last_opened: now,
        },
    );
    config.recent_projects.truncate(MAX_RECENT_PROJECTS);

    app_config::write_config(&config)?;
    Ok(config)
}

#[tauri::command]
pub async fn read_asdfrc() -> Result<Vec<(String, String)>, AppError> {
    app_config::read_asdfrc()
}
