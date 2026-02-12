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

/// Parse .asdfrc content string into key-value pairs.
/// Separated from file I/O for testability.
fn parse_asdfrc_content(content: &str) -> Vec<(String, String)> {
    content
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                return None;
            }
            line.split_once('=')
                .map(|(k, v)| (k.trim().to_string(), v.trim().to_string()))
        })
        .collect()
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
    Ok(parse_asdfrc_content(&content))
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── AppConfig Default ──────────────────────────────────────────

    #[test]
    fn test_app_config_default_values() {
        let config = AppConfig::default();
        assert_eq!(config.language, "en");
        assert_eq!(config.theme, "system");
        assert!(config.asdf_binary_path.is_none());
        assert!(config.working_directory.is_none());
        assert!(!config.keep_downloads);
        assert!(config.notifications);
        assert!(config.recent_projects.is_empty());
    }

    // ── AppConfig Serde ────────────────────────────────────────────

    #[test]
    fn test_app_config_serde_roundtrip() {
        let config = AppConfig {
            language: "zh-TW".to_string(),
            theme: "dark".to_string(),
            asdf_binary_path: Some("/usr/local/bin/asdf".to_string()),
            working_directory: Some("/home/user/project".to_string()),
            keep_downloads: true,
            notifications: false,
            recent_projects: vec![RecentProject {
                path: "/home/user/project".to_string(),
                name: "project".to_string(),
                last_opened: 1700000000,
            }],
        };
        let json = serde_json::to_string_pretty(&config).unwrap();
        let back: AppConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(back.language, "zh-TW");
        assert_eq!(back.theme, "dark");
        assert_eq!(
            back.asdf_binary_path.as_deref(),
            Some("/usr/local/bin/asdf")
        );
        assert!(back.keep_downloads);
        assert!(!back.notifications);
        assert_eq!(back.recent_projects.len(), 1);
        assert_eq!(back.recent_projects[0].name, "project");
        assert_eq!(back.recent_projects[0].last_opened, 1700000000);
    }

    #[test]
    fn test_app_config_default_serde_roundtrip() {
        let config = AppConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        let back: AppConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(back.language, config.language);
        assert_eq!(back.theme, config.theme);
    }

    #[test]
    fn test_app_config_deserialization_rejects_missing_fields() {
        let json = r#"{"language":"en"}"#;
        let result = serde_json::from_str::<AppConfig>(json);
        assert!(result.is_err());
    }

    #[test]
    fn test_app_config_with_empty_recent_projects() {
        let json = serde_json::to_string(&AppConfig::default()).unwrap();
        assert!(json.contains("\"recent_projects\":[]"));
    }

    #[test]
    fn test_recent_project_serde_roundtrip() {
        let project = RecentProject {
            path: "/Users/test/myproject".to_string(),
            name: "myproject".to_string(),
            last_opened: 1234567890,
        };
        let json = serde_json::to_string(&project).unwrap();
        let back: RecentProject = serde_json::from_str(&json).unwrap();
        assert_eq!(back.path, "/Users/test/myproject");
        assert_eq!(back.name, "myproject");
        assert_eq!(back.last_opened, 1234567890);
    }

    // ── AppConfig Clone ────────────────────────────────────────────

    #[test]
    fn test_app_config_clone() {
        let config = AppConfig {
            language: "en".to_string(),
            theme: "dark".to_string(),
            asdf_binary_path: None,
            working_directory: Some("/path".to_string()),
            keep_downloads: false,
            notifications: true,
            recent_projects: vec![RecentProject {
                path: "/p".to_string(),
                name: "p".to_string(),
                last_opened: 0,
            }],
        };
        let cloned = config.clone();
        assert_eq!(cloned.language, config.language);
        assert_eq!(cloned.recent_projects.len(), 1);
    }

    // ── parse_asdfrc_content ───────────────────────────────────────

    #[test]
    fn test_parse_asdfrc_content_basic() {
        let content = "legacy_version_file = yes\nalways_keep_download = no\n";
        let pairs = parse_asdfrc_content(content);
        assert_eq!(pairs.len(), 2);
        assert_eq!(
            pairs[0],
            ("legacy_version_file".to_string(), "yes".to_string())
        );
        assert_eq!(
            pairs[1],
            ("always_keep_download".to_string(), "no".to_string())
        );
    }

    #[test]
    fn test_parse_asdfrc_content_empty() {
        let pairs = parse_asdfrc_content("");
        assert!(pairs.is_empty());
    }

    #[test]
    fn test_parse_asdfrc_content_comments_only() {
        let content = "# this is a comment\n# another comment\n";
        let pairs = parse_asdfrc_content(content);
        assert!(pairs.is_empty());
    }

    #[test]
    fn test_parse_asdfrc_content_mixed() {
        let content = "# Configuration\nlegacy_version_file = yes\n\n# Another setting\nalways_keep_download = no\n";
        let pairs = parse_asdfrc_content(content);
        assert_eq!(pairs.len(), 2);
    }

    #[test]
    fn test_parse_asdfrc_content_no_spaces_around_equals() {
        let content = "key=value\n";
        let pairs = parse_asdfrc_content(content);
        assert_eq!(pairs[0], ("key".to_string(), "value".to_string()));
    }

    #[test]
    fn test_parse_asdfrc_content_extra_spaces() {
        let content = "  key  =  value  \n";
        let pairs = parse_asdfrc_content(content);
        assert_eq!(pairs[0], ("key".to_string(), "value".to_string()));
    }

    #[test]
    fn test_parse_asdfrc_content_value_with_equals() {
        let content = "key = val=ue\n";
        let pairs = parse_asdfrc_content(content);
        assert_eq!(pairs[0].0, "key");
        assert_eq!(pairs[0].1, "val=ue");
    }

    #[test]
    fn test_parse_asdfrc_content_blank_lines_skipped() {
        let content = "\n\nkey = value\n\n\n";
        let pairs = parse_asdfrc_content(content);
        assert_eq!(pairs.len(), 1);
    }

    #[test]
    fn test_parse_asdfrc_content_no_equals_skipped() {
        let content = "no_equals_here\nkey = value\n";
        let pairs = parse_asdfrc_content(content);
        assert_eq!(pairs.len(), 1);
        assert_eq!(pairs[0].0, "key");
    }

    // ── config_dir / config_path ───────────────────────────────────

    #[test]
    fn test_config_dir_returns_asdf_gui_subdir() {
        let dir = config_dir().unwrap();
        assert!(dir.to_string_lossy().contains(".asdf-gui"));
    }

    #[test]
    fn test_config_path_returns_json_file() {
        let path = config_path().unwrap();
        assert!(path.to_string_lossy().ends_with("config.json"));
    }

    // ── Cross-platform path separator ──────────────────────────────

    #[test]
    fn test_config_dir_uses_platform_separator() {
        let dir = config_dir().unwrap();
        let s = dir.to_string_lossy();
        // On all platforms, the path should end with .asdf-gui
        assert!(s.ends_with(".asdf-gui"));
    }

    // ── AppConfig with Windows paths ───────────────────────────────

    #[test]
    fn test_app_config_windows_paths() {
        let config = AppConfig {
            language: "en".to_string(),
            theme: "system".to_string(),
            asdf_binary_path: Some("C:\\Users\\user\\.asdf\\bin\\asdf.exe".to_string()),
            working_directory: Some("C:\\Users\\user\\project".to_string()),
            keep_downloads: false,
            notifications: true,
            recent_projects: vec![],
        };
        let json = serde_json::to_string(&config).unwrap();
        let back: AppConfig = serde_json::from_str(&json).unwrap();
        assert!(back.asdf_binary_path.unwrap().contains("C:\\"));
    }
}
