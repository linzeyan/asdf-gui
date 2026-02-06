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
