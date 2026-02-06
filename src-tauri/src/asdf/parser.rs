use crate::error::AppError;
use crate::types::*;

/// Parse `asdf current` output.
/// Each line: `name    version    source` (tab or multi-space separated).
/// The "installed" column may appear as a 4th field in newer versions.
pub fn parse_current(stdout: &str) -> Result<Vec<CurrentVersion>, AppError> {
    let mut results = Vec::new();
    for line in stdout.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 2 {
            continue;
        }
        let name = parts[0].to_string();
        let version = parts[1].to_string();
        let source = parts.get(2).unwrap_or(&"").to_string();
        let installed = parts
            .get(3)
            .map(|s| *s == "true")
            .unwrap_or(!version.contains("Not installed"));
        results.push(CurrentVersion {
            name,
            version,
            source,
            installed,
        });
    }
    Ok(results)
}

/// Parse `asdf plugin list [--urls] [--refs]` output.
/// Each line: `name [url [ref]]`.
pub fn parse_plugin_list(stdout: &str) -> Result<Vec<Plugin>, AppError> {
    let mut results = Vec::new();
    for line in stdout.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let parts: Vec<&str> = line.split_whitespace().collect();
        let name = parts[0].to_string();
        let url = parts.get(1).map(|s| s.to_string());
        let git_ref = parts.get(2).map(|s| s.to_string());
        results.push(Plugin { name, url, git_ref });
    }
    Ok(results)
}

/// Parse `asdf plugin list all` output.
/// Each line: `name  url`.
pub fn parse_plugin_list_all(stdout: &str) -> Result<Vec<PluginRegistry>, AppError> {
    let mut results = Vec::new();
    for line in stdout.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 2 {
            continue;
        }
        results.push(PluginRegistry {
            name: parts[0].to_string(),
            url: parts[1].to_string(),
        });
    }
    Ok(results)
}

/// Parse `asdf list <name>` output.
/// Each line: `  version` or ` *version` (asterisk marks current).
/// Returns (version, is_current) pairs.
pub fn parse_list_installed(stdout: &str) -> Vec<(String, bool)> {
    let mut results = Vec::new();
    for line in stdout.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        if let Some(version) = trimmed.strip_prefix('*') {
            results.push((version.trim().to_string(), true));
        } else {
            results.push((trimmed.to_string(), false));
        }
    }
    results
}

/// Parse `asdf list all <name>` output.
/// Each line is a version string.
pub fn parse_list_all(stdout: &str) -> Vec<String> {
    stdout
        .lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect()
}

/// Parse `asdf latest --all` output.
/// Each line: `name  latest_version  installed_version`.
pub fn parse_latest_all(stdout: &str) -> Result<Vec<LatestInfo>, AppError> {
    let mut results = Vec::new();
    for line in stdout.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 2 {
            continue;
        }
        let name = parts[0].to_string();
        let latest = parts[1].to_string();
        let installed_version = parts.get(2).map(|s| s.to_string());
        let up_to_date = installed_version.as_deref() == Some(latest.as_str());
        results.push(LatestInfo {
            name,
            latest,
            installed_version,
            up_to_date,
        });
    }
    Ok(results)
}

/// Parse `asdf shimversions <command>` output.
/// Each line: `plugin version`.
pub fn parse_shim_versions(stdout: &str) -> Vec<ShimVersion> {
    stdout
        .lines()
        .filter_map(|line| {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                Some(ShimVersion {
                    plugin: parts[0].to_string(),
                    version: parts[1].to_string(),
                })
            } else {
                None
            }
        })
        .collect()
}

/// Parse a `.tool-versions` file content.
pub fn parse_tool_versions(content: &str) -> Vec<ToolVersion> {
    content
        .lines()
        .filter_map(|line| {
            // Strip comments
            let line = line.split('#').next().unwrap_or("").trim();
            if line.is_empty() {
                return None;
            }
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.is_empty() {
                return None;
            }
            let tool = parts[0].to_string();
            let versions = parts[1..].iter().map(|s| s.to_string()).collect();
            Some(ToolVersion { tool, versions })
        })
        .collect()
}

/// Parse `asdf env <command>` output.
/// Each line: `KEY=value`.
pub fn parse_env(stdout: &str) -> Vec<EnvVar> {
    stdout
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            if let Some((key, value)) = line.split_once('=') {
                Some(EnvVar {
                    key: key.to_string(),
                    value: value.to_string(),
                })
            } else {
                None
            }
        })
        .collect()
}
