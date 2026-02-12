use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plugin {
    pub name: String,
    pub url: Option<String>,
    pub git_ref: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginRegistry {
    pub name: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurrentVersion {
    pub name: String,
    pub version: String,
    pub source: String,
    pub installed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatestInfo {
    pub name: String,
    pub latest: String,
    pub installed_version: Option<String>,
    pub up_to_date: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShimVersion {
    pub plugin: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvVar {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AsdfInfo {
    pub version: String,
    pub os: String,
    pub shell: String,
    pub asdf_dir: String,
    pub asdf_data_dir: String,
    pub plugins: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolVersion {
    pub tool: String,
    pub versions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SetScope {
    Local,
    Home,
    Parent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InstallEvent {
    Stdout(String),
    Stderr(String),
    Finished { success: bool },
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── Serde round-trip tests ─────────────────────────────────────

    #[test]
    fn test_plugin_serde_roundtrip() {
        let plugin = Plugin {
            name: "nodejs".to_string(),
            url: Some("https://github.com/example.git".to_string()),
            git_ref: Some("main".to_string()),
        };
        let json = serde_json::to_string(&plugin).unwrap();
        let deserialized: Plugin = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.name, "nodejs");
        assert_eq!(
            deserialized.url.as_deref(),
            Some("https://github.com/example.git")
        );
        assert_eq!(deserialized.git_ref.as_deref(), Some("main"));
    }

    #[test]
    fn test_plugin_serde_with_nulls() {
        let json = r#"{"name":"python","url":null,"git_ref":null}"#;
        let plugin: Plugin = serde_json::from_str(json).unwrap();
        assert_eq!(plugin.name, "python");
        assert!(plugin.url.is_none());
        assert!(plugin.git_ref.is_none());
    }

    #[test]
    fn test_plugin_registry_serde_roundtrip() {
        let reg = PluginRegistry {
            name: "nodejs".to_string(),
            url: "https://github.com/example.git".to_string(),
        };
        let json = serde_json::to_string(&reg).unwrap();
        let back: PluginRegistry = serde_json::from_str(&json).unwrap();
        assert_eq!(back.name, reg.name);
        assert_eq!(back.url, reg.url);
    }

    #[test]
    fn test_current_version_serde_roundtrip() {
        let cv = CurrentVersion {
            name: "nodejs".to_string(),
            version: "20.11.0".to_string(),
            source: "/home/user/.tool-versions".to_string(),
            installed: true,
        };
        let json = serde_json::to_string(&cv).unwrap();
        let back: CurrentVersion = serde_json::from_str(&json).unwrap();
        assert_eq!(back.name, "nodejs");
        assert!(back.installed);
    }

    #[test]
    fn test_latest_info_serde_roundtrip() {
        let info = LatestInfo {
            name: "python".to_string(),
            latest: "3.12.1".to_string(),
            installed_version: None,
            up_to_date: false,
        };
        let json = serde_json::to_string(&info).unwrap();
        let back: LatestInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(back.name, "python");
        assert!(back.installed_version.is_none());
        assert!(!back.up_to_date);
    }

    #[test]
    fn test_latest_info_up_to_date() {
        let info = LatestInfo {
            name: "nodejs".to_string(),
            latest: "20.11.0".to_string(),
            installed_version: Some("20.11.0".to_string()),
            up_to_date: true,
        };
        let json = serde_json::to_string(&info).unwrap();
        let back: LatestInfo = serde_json::from_str(&json).unwrap();
        assert!(back.up_to_date);
        assert_eq!(back.installed_version.as_deref(), Some("20.11.0"));
    }

    #[test]
    fn test_shim_version_serde_roundtrip() {
        let sv = ShimVersion {
            plugin: "nodejs".to_string(),
            version: "20.11.0".to_string(),
        };
        let json = serde_json::to_string(&sv).unwrap();
        let back: ShimVersion = serde_json::from_str(&json).unwrap();
        assert_eq!(back.plugin, "nodejs");
    }

    #[test]
    fn test_env_var_serde_roundtrip() {
        let ev = EnvVar {
            key: "PATH".to_string(),
            value: "/usr/bin:/usr/local/bin".to_string(),
        };
        let json = serde_json::to_string(&ev).unwrap();
        let back: EnvVar = serde_json::from_str(&json).unwrap();
        assert_eq!(back.key, "PATH");
    }

    #[test]
    fn test_asdf_info_serde_roundtrip() {
        let info = AsdfInfo {
            version: "0.14.0".to_string(),
            os: "linux".to_string(),
            shell: "/bin/bash".to_string(),
            asdf_dir: "/home/user/.asdf".to_string(),
            asdf_data_dir: "/home/user/.asdf".to_string(),
            plugins: vec!["nodejs".to_string(), "python".to_string()],
        };
        let json = serde_json::to_string(&info).unwrap();
        let back: AsdfInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(back.version, "0.14.0");
        assert_eq!(back.plugins.len(), 2);
    }

    #[test]
    fn test_tool_version_serde_roundtrip() {
        let tv = ToolVersion {
            tool: "python".to_string(),
            versions: vec!["3.12.1".to_string(), "3.11.7".to_string()],
        };
        let json = serde_json::to_string(&tv).unwrap();
        let back: ToolVersion = serde_json::from_str(&json).unwrap();
        assert_eq!(back.versions.len(), 2);
    }

    #[test]
    fn test_tool_version_empty_versions() {
        let tv = ToolVersion {
            tool: "nodejs".to_string(),
            versions: vec![],
        };
        let json = serde_json::to_string(&tv).unwrap();
        let back: ToolVersion = serde_json::from_str(&json).unwrap();
        assert!(back.versions.is_empty());
    }

    // ── SetScope enum ──────────────────────────────────────────────

    #[test]
    fn test_set_scope_local_serde() {
        let scope = SetScope::Local;
        let json = serde_json::to_string(&scope).unwrap();
        assert_eq!(json, "\"Local\"");
        let back: SetScope = serde_json::from_str(&json).unwrap();
        assert!(matches!(back, SetScope::Local));
    }

    #[test]
    fn test_set_scope_home_serde() {
        let scope = SetScope::Home;
        let json = serde_json::to_string(&scope).unwrap();
        assert_eq!(json, "\"Home\"");
        let back: SetScope = serde_json::from_str(&json).unwrap();
        assert!(matches!(back, SetScope::Home));
    }

    #[test]
    fn test_set_scope_parent_serde() {
        let scope = SetScope::Parent;
        let json = serde_json::to_string(&scope).unwrap();
        assert_eq!(json, "\"Parent\"");
        let back: SetScope = serde_json::from_str(&json).unwrap();
        assert!(matches!(back, SetScope::Parent));
    }

    // ── InstallEvent enum ──────────────────────────────────────────

    #[test]
    fn test_install_event_stdout_serde() {
        let event = InstallEvent::Stdout("downloading...".to_string());
        let json = serde_json::to_string(&event).unwrap();
        let back: InstallEvent = serde_json::from_str(&json).unwrap();
        assert!(matches!(back, InstallEvent::Stdout(s) if s == "downloading..."));
    }

    #[test]
    fn test_install_event_stderr_serde() {
        let event = InstallEvent::Stderr("warning: ...".to_string());
        let json = serde_json::to_string(&event).unwrap();
        let back: InstallEvent = serde_json::from_str(&json).unwrap();
        assert!(matches!(back, InstallEvent::Stderr(s) if s == "warning: ..."));
    }

    #[test]
    fn test_install_event_finished_success_serde() {
        let event = InstallEvent::Finished { success: true };
        let json = serde_json::to_string(&event).unwrap();
        let back: InstallEvent = serde_json::from_str(&json).unwrap();
        assert!(matches!(back, InstallEvent::Finished { success: true }));
    }

    #[test]
    fn test_install_event_finished_failure_serde() {
        let event = InstallEvent::Finished { success: false };
        let json = serde_json::to_string(&event).unwrap();
        let back: InstallEvent = serde_json::from_str(&json).unwrap();
        assert!(matches!(back, InstallEvent::Finished { success: false }));
    }

    // ── Clone tests ────────────────────────────────────────────────

    #[test]
    fn test_plugin_clone() {
        let plugin = Plugin {
            name: "nodejs".to_string(),
            url: Some("url".to_string()),
            git_ref: None,
        };
        let cloned = plugin.clone();
        assert_eq!(cloned.name, plugin.name);
        assert_eq!(cloned.url, plugin.url);
    }

    #[test]
    fn test_install_event_clone() {
        let event = InstallEvent::Stdout("line".to_string());
        let cloned = event.clone();
        assert!(matches!(cloned, InstallEvent::Stdout(s) if s == "line"));
    }

    // ── Edge cases ─────────────────────────────────────────────────

    #[test]
    fn test_plugin_with_unicode_name() {
        let plugin = Plugin {
            name: "プラグイン".to_string(),
            url: None,
            git_ref: None,
        };
        let json = serde_json::to_string(&plugin).unwrap();
        let back: Plugin = serde_json::from_str(&json).unwrap();
        assert_eq!(back.name, "プラグイン");
    }

    #[test]
    fn test_env_var_with_empty_key() {
        let ev = EnvVar {
            key: String::new(),
            value: "val".to_string(),
        };
        let json = serde_json::to_string(&ev).unwrap();
        let back: EnvVar = serde_json::from_str(&json).unwrap();
        assert!(back.key.is_empty());
    }

    #[test]
    fn test_deserialization_rejects_invalid_scope() {
        let result = serde_json::from_str::<SetScope>("\"Invalid\"");
        assert!(result.is_err());
    }

    #[test]
    fn test_deserialization_rejects_missing_required_fields() {
        // PluginRegistry requires both name and url (non-optional)
        let result = serde_json::from_str::<PluginRegistry>(r#"{"name":"test"}"#);
        assert!(result.is_err());
    }

    #[test]
    fn test_current_version_installed_false() {
        let cv = CurrentVersion {
            name: "ruby".to_string(),
            version: "3.3.0".to_string(),
            source: "Not installed".to_string(),
            installed: false,
        };
        let json = serde_json::to_string(&cv).unwrap();
        let back: CurrentVersion = serde_json::from_str(&json).unwrap();
        assert!(!back.installed);
    }

    #[test]
    fn test_asdf_info_empty_plugins() {
        let info = AsdfInfo {
            version: "0.14.0".to_string(),
            os: "darwin".to_string(),
            shell: "/bin/zsh".to_string(),
            asdf_dir: "/Users/user/.asdf".to_string(),
            asdf_data_dir: "/Users/user/.asdf".to_string(),
            plugins: vec![],
        };
        let json = serde_json::to_string(&info).unwrap();
        let back: AsdfInfo = serde_json::from_str(&json).unwrap();
        assert!(back.plugins.is_empty());
    }
}
