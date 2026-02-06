use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub language: String,
    pub theme: String,
    pub asdf_binary_path: Option<String>,
    pub working_directory: Option<String>,
    pub keep_downloads: bool,
    pub notifications: bool,
    pub recent_projects: Vec<RecentProject>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentProject {
    pub path: String,
    pub name: String,
    pub last_opened: u64,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            language: "en".to_string(),
            theme: "system".to_string(),
            asdf_binary_path: None,
            working_directory: None,
            keep_downloads: false,
            notifications: true,
            recent_projects: Vec::new(),
        }
    }
}

fn config_dir() -> Result<PathBuf, AppError> {
    let home = dirs::home_dir()
        .ok_or_else(|| AppError::ConfigError("cannot determine home directory".to_string()))?;
    Ok(home.join(".asdf-gui"))
}

fn config_path() -> Result<PathBuf, AppError> {
    Ok(config_dir()?.join("config.json"))
}

pub fn read_config() -> Result<AppConfig, AppError> {
    let path = config_path()?;
    if !path.exists() {
        let config = AppConfig::default();
        write_config(&config)?;
        return Ok(config);
    }
    let content = std::fs::read_to_string(&path)?;
    serde_json::from_str(&content).map_err(|e| AppError::ConfigError(e.to_string()))
}

pub fn write_config(config: &AppConfig) -> Result<(), AppError> {
    let dir = config_dir()?;
    std::fs::create_dir_all(&dir)?;
    let path = dir.join("config.json");
    let content =
        serde_json::to_string_pretty(config).map_err(|e| AppError::ConfigError(e.to_string()))?;
    std::fs::write(&path, content)?;
    Ok(())
}

/// Read .asdfrc as key-value pairs.
pub fn read_asdfrc() -> Result<Vec<(String, String)>, AppError> {
    let home = dirs::home_dir()
        .ok_or_else(|| AppError::ConfigError("cannot determine home directory".to_string()))?;

    let asdfrc_path = std::env::var("ASDF_CONFIG_FILE")
        .map(PathBuf::from)
        .unwrap_or_else(|_| home.join(".asdfrc"));

    if !asdfrc_path.exists() {
        return Ok(Vec::new());
    }

    let content = std::fs::read_to_string(&asdfrc_path)?;
    let pairs = content
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                return None;
            }
            line.split_once('=')
                .map(|(k, v)| (k.trim().to_string(), v.trim().to_string()))
        })
        .collect();

    Ok(pairs)
}
