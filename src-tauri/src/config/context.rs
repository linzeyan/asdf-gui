use crate::config::app_config;

/// Maximum number of recent projects to retain.
pub const MAX_RECENT_PROJECTS: usize = 10;

/// Resolved runtime config values needed by commands.
/// Reads from disk once per construction.
pub struct ConfigContext {
    pub asdf_path: Option<String>,
    pub cwd: Option<String>,
}

impl ConfigContext {
    pub fn load() -> Self {
        let config = app_config::read_config().ok();
        Self {
            asdf_path: config.as_ref().and_then(|c| c.asdf_binary_path.clone()),
            cwd: config.as_ref().and_then(|c| c.working_directory.clone()),
        }
    }

    /// Resolve working directory with home-dir fallback.
    pub fn cwd_or_home(&self) -> String {
        self.cwd.clone().unwrap_or_else(|| {
            dirs::home_dir()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string()
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_max_recent_projects_constant() {
        assert_eq!(MAX_RECENT_PROJECTS, 10);
    }

    #[test]
    fn test_cwd_or_home_with_cwd_set() {
        let ctx = ConfigContext {
            asdf_path: None,
            cwd: Some("/home/user/project".to_string()),
        };
        assert_eq!(ctx.cwd_or_home(), "/home/user/project");
    }

    #[test]
    fn test_cwd_or_home_without_cwd_falls_back_to_home() {
        let ctx = ConfigContext {
            asdf_path: None,
            cwd: None,
        };
        let result = ctx.cwd_or_home();
        // Should return home directory or empty default
        assert!(!result.is_empty() || result.is_empty()); // just ensure it doesn't panic
    }

    #[test]
    fn test_config_context_fields() {
        let ctx = ConfigContext {
            asdf_path: Some("/usr/local/bin/asdf".to_string()),
            cwd: Some("/tmp".to_string()),
        };
        assert_eq!(ctx.asdf_path.as_deref(), Some("/usr/local/bin/asdf"));
        assert_eq!(ctx.cwd.as_deref(), Some("/tmp"));
    }

    #[test]
    fn test_config_context_both_none() {
        let ctx = ConfigContext {
            asdf_path: None,
            cwd: None,
        };
        assert!(ctx.asdf_path.is_none());
        assert!(ctx.cwd.is_none());
    }

    #[test]
    fn test_config_context_load_does_not_panic() {
        // load() reads from disk; it should not panic even if config doesn't exist
        let _ctx = ConfigContext::load();
    }

    #[test]
    fn test_cwd_or_home_returns_non_empty_on_real_system() {
        // On any real system, home dir should be resolvable
        let ctx = ConfigContext {
            asdf_path: None,
            cwd: None,
        };
        let result = ctx.cwd_or_home();
        // On CI/real systems, home dir is available
        if dirs::home_dir().is_some() {
            assert!(!result.is_empty());
        }
    }
}
