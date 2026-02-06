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
