use std::path::PathBuf;

use crate::asdf::parser;
use crate::config::app_config;
use crate::error::AppError;
use crate::types::{SetScope, ToolVersion};

#[tauri::command]
pub async fn read_tool_versions(path: String) -> Result<Vec<ToolVersion>, AppError> {
    let content = std::fs::read_to_string(&path)?;
    Ok(parser::parse_tool_versions(&content))
}

#[tauri::command]
pub async fn write_tool_versions(path: String, entries: Vec<ToolVersion>) -> Result<(), AppError> {
    let content = entries
        .iter()
        .map(|e| format!("{} {}", e.tool, e.versions.join(" ")))
        .collect::<Vec<_>>()
        .join("\n");
    let content = if content.is_empty() {
        content
    } else {
        format!("{content}\n")
    };
    std::fs::write(&path, content)?;
    Ok(())
}

#[tauri::command]
pub async fn get_tool_versions_path(scope: SetScope) -> Result<String, AppError> {
    let config = app_config::read_config().ok();

    match scope {
        SetScope::Home => {
            let home = dirs::home_dir().ok_or_else(|| {
                AppError::ConfigError("cannot determine home directory".to_string())
            })?;
            Ok(home.join(".tool-versions").to_string_lossy().to_string())
        }
        SetScope::Local => {
            let cwd = config.and_then(|c| c.working_directory).unwrap_or_else(|| {
                dirs::home_dir()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string()
            });
            Ok(PathBuf::from(cwd)
                .join(".tool-versions")
                .to_string_lossy()
                .to_string())
        }
        SetScope::Parent => {
            let cwd = config.and_then(|c| c.working_directory).unwrap_or_else(|| {
                dirs::home_dir()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string()
            });

            // Walk up directories to find closest .tool-versions
            let mut dir = PathBuf::from(&cwd);
            loop {
                let candidate = dir.join(".tool-versions");
                if candidate.exists() {
                    return Ok(candidate.to_string_lossy().to_string());
                }
                if !dir.pop() {
                    break;
                }
            }

            // Fallback to cwd
            Ok(PathBuf::from(cwd)
                .join(".tool-versions")
                .to_string_lossy()
                .to_string())
        }
    }
}
