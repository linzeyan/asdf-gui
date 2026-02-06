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

/// Parse `asdf info` output.
/// Multi-line format with labeled sections.
pub fn parse_asdf_info(stdout: &str) -> Result<AsdfInfo, AppError> {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_current() {
        let input = "nodejs          20.11.0         /home/user/.tool-versions\npython          3.12.1          Not installed\n";
        let result = parse_current(input).unwrap();
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].name, "nodejs");
        assert_eq!(result[0].version, "20.11.0");
        assert!(result[0].installed);
        assert_eq!(result[1].name, "python");
        assert_eq!(result[1].version, "3.12.1");
        assert!(!result[1].installed);
    }

    #[test]
    fn test_parse_current_empty() {
        let result = parse_current("").unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_parse_plugin_list() {
        let input = "nodejs  https://github.com/asdf-vm/asdf-nodejs.git  main\npython\n";
        let result = parse_plugin_list(input).unwrap();
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].name, "nodejs");
        assert_eq!(
            result[0].url.as_deref(),
            Some("https://github.com/asdf-vm/asdf-nodejs.git")
        );
        assert_eq!(result[0].git_ref.as_deref(), Some("main"));
        assert_eq!(result[1].name, "python");
        assert!(result[1].url.is_none());
    }

    #[test]
    fn test_parse_plugin_list_all() {
        let input = "nodejs  https://github.com/asdf-vm/asdf-nodejs.git\npython  https://github.com/asdf-community/asdf-python.git\n";
        let result = parse_plugin_list_all(input).unwrap();
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].name, "nodejs");
        assert!(result[0].url.contains("asdf-nodejs"));
    }

    #[test]
    fn test_parse_list_installed() {
        let input = "  18.17.0\n *20.11.0\n  21.0.0\n";
        let result = parse_list_installed(input);
        assert_eq!(result.len(), 3);
        assert_eq!(result[0], ("18.17.0".to_string(), false));
        assert_eq!(result[1], ("20.11.0".to_string(), true));
        assert_eq!(result[2], ("21.0.0".to_string(), false));
    }

    #[test]
    fn test_parse_list_all() {
        let input = "18.0.0\n18.1.0\n20.0.0\n";
        let result = parse_list_all(input);
        assert_eq!(result, vec!["18.0.0", "18.1.0", "20.0.0"]);
    }

    #[test]
    fn test_parse_list_all_filters_blanks() {
        let input = "18.0.0\n\n20.0.0\n  \n";
        let result = parse_list_all(input);
        assert_eq!(result, vec!["18.0.0", "20.0.0"]);
    }

    #[test]
    fn test_parse_latest_all() {
        let input = "nodejs  20.11.0  20.11.0\npython  3.12.1\n";
        let result = parse_latest_all(input).unwrap();
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].name, "nodejs");
        assert_eq!(result[0].latest, "20.11.0");
        assert!(result[0].up_to_date);
        assert_eq!(result[1].name, "python");
        assert_eq!(result[1].latest, "3.12.1");
        assert!(result[1].installed_version.is_none());
        assert!(!result[1].up_to_date);
    }

    #[test]
    fn test_parse_shim_versions() {
        let input = "nodejs 20.11.0\nnodejs 18.17.0\n";
        let result = parse_shim_versions(input);
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].plugin, "nodejs");
        assert_eq!(result[0].version, "20.11.0");
    }

    #[test]
    fn test_parse_tool_versions() {
        let input = "nodejs 20.11.0\npython 3.12.1 3.11.7\n# comment line\nruby 3.3.0\n";
        let result = parse_tool_versions(input);
        assert_eq!(result.len(), 3);
        assert_eq!(result[0].tool, "nodejs");
        assert_eq!(result[0].versions, vec!["20.11.0"]);
        assert_eq!(result[1].tool, "python");
        assert_eq!(result[1].versions, vec!["3.12.1", "3.11.7"]);
        assert_eq!(result[2].tool, "ruby");
    }

    #[test]
    fn test_parse_tool_versions_inline_comment() {
        let input = "nodejs 20.11.0 # LTS\n";
        let result = parse_tool_versions(input);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].versions, vec!["20.11.0"]);
    }

    #[test]
    fn test_parse_env() {
        let input = "ASDF_DIR=/home/user/.asdf\nASDF_DATA_DIR=/home/user/.asdf\nPATH=/usr/bin\n";
        let result = parse_env(input);
        assert_eq!(result.len(), 3);
        assert_eq!(result[0].key, "ASDF_DIR");
        assert_eq!(result[0].value, "/home/user/.asdf");
    }

    #[test]
    fn test_parse_env_with_equals_in_value() {
        let input = "FOO=bar=baz\n";
        let result = parse_env(input);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].key, "FOO");
        assert_eq!(result[0].value, "bar=baz");
    }

    #[test]
    fn test_parse_asdf_info() {
        let input = "ASDF VERSION: 0.14.0\nOS: linux\nSHELL: /bin/bash\nASDF DIR: /home/user/.asdf\nASDF DATA DIR: /home/user/.asdf\n\nASDF INSTALLED PLUGINS:\nnodejs\npython\n";
        let result = parse_asdf_info(input).unwrap();
        assert_eq!(result.version, "0.14.0");
        assert_eq!(result.os, "linux");
        assert_eq!(result.shell, "/bin/bash");
        assert_eq!(result.asdf_dir, "/home/user/.asdf");
        assert_eq!(result.asdf_data_dir, "/home/user/.asdf");
        assert_eq!(result.plugins, vec!["nodejs", "python"]);
    }

    #[test]
    fn test_parse_asdf_info_empty() {
        let result = parse_asdf_info("").unwrap();
        assert!(result.version.is_empty());
        assert!(result.plugins.is_empty());
    }
}
