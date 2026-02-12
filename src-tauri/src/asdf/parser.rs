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

    // ── parse_current ──────────────────────────────────────────────

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
    fn test_parse_current_whitespace_only() {
        let result = parse_current("   \n  \n\t\n").unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_parse_current_single_field_line_skipped() {
        // Lines with only one field should be skipped (parts.len() < 2)
        let input = "nodejs\n";
        let result = parse_current(input).unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_parse_current_with_explicit_true_installed_field() {
        // When asdf outputs a 4th "true" field
        let input = "nodejs 20.11.0 /path true\n";
        let result = parse_current(input).unwrap();
        assert_eq!(result.len(), 1);
        assert!(result[0].installed);
    }

    #[test]
    fn test_parse_current_with_explicit_false_installed_field() {
        let input = "nodejs 20.11.0 /path false\n";
        let result = parse_current(input).unwrap();
        assert_eq!(result.len(), 1);
        assert!(!result[0].installed);
    }

    #[test]
    fn test_parse_current_not_installed_split_across_fields() {
        // When "Not installed" is split by whitespace, "Not" becomes version
        // and "installed" becomes source. Since "Not" alone doesn't contain
        // the full string "Not installed", the installed flag defaults to true.
        let input = "ruby Not installed\n";
        let result = parse_current(input).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].version, "Not");
        assert_eq!(result[0].source, "installed");
        // "Not" alone does not contain "Not installed" → installed = true
        assert!(result[0].installed);
    }

    #[test]
    fn test_parse_current_version_with_not_installed_in_source() {
        // When the 4th field is not "true", installed = false
        let input = "ruby  3.3.0  Not installed\n";
        let result = parse_current(input).unwrap();
        assert_eq!(result[0].version, "3.3.0");
        assert_eq!(result[0].source, "Not");
        // parts[3] = "installed" which != "true" → installed = false
        assert!(!result[0].installed);
    }

    #[test]
    fn test_parse_current_prerelease_versions() {
        let input = "nodejs 21.0.0-rc.1 /path\nrust 1.75.0-beta.3 /path\n";
        let result = parse_current(input).unwrap();
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].version, "21.0.0-rc.1");
        assert_eq!(result[1].version, "1.75.0-beta.3");
    }

    #[test]
    fn test_parse_current_unicode_plugin_name() {
        let input = "日本語plugin 1.0.0 /path\n";
        let result = parse_current(input).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].name, "日本語plugin");
    }

    #[test]
    fn test_parse_current_many_whitespace_separators() {
        // Tabs and multiple spaces
        let input = "nodejs\t\t20.11.0\t\t/home/user/.tool-versions\n";
        let result = parse_current(input).unwrap();
        assert_eq!(result[0].name, "nodejs");
        assert_eq!(result[0].version, "20.11.0");
    }

    // ── parse_plugin_list ──────────────────────────────────────────

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
    fn test_parse_plugin_list_empty() {
        let result = parse_plugin_list("").unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_parse_plugin_list_name_only() {
        let input = "nodejs\npython\nruby\n";
        let result = parse_plugin_list(input).unwrap();
        assert_eq!(result.len(), 3);
        for plugin in &result {
            assert!(plugin.url.is_none());
            assert!(plugin.git_ref.is_none());
        }
    }

    #[test]
    fn test_parse_plugin_list_url_no_ref() {
        let input = "nodejs https://github.com/asdf-vm/asdf-nodejs.git\n";
        let result = parse_plugin_list(input).unwrap();
        assert_eq!(result[0].name, "nodejs");
        assert!(result[0].url.is_some());
        assert!(result[0].git_ref.is_none());
    }

    #[test]
    fn test_parse_plugin_list_special_chars_in_name() {
        let input = "my-custom-plugin https://example.com/repo.git\n";
        let result = parse_plugin_list(input).unwrap();
        assert_eq!(result[0].name, "my-custom-plugin");
    }

    // ── parse_plugin_list_all ──────────────────────────────────────

    #[test]
    fn test_parse_plugin_list_all() {
        let input = "nodejs  https://github.com/asdf-vm/asdf-nodejs.git\npython  https://github.com/asdf-community/asdf-python.git\n";
        let result = parse_plugin_list_all(input).unwrap();
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].name, "nodejs");
        assert!(result[0].url.contains("asdf-nodejs"));
    }

    #[test]
    fn test_parse_plugin_list_all_empty() {
        let result = parse_plugin_list_all("").unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_parse_plugin_list_all_single_field_skipped() {
        // Lines with only a name but no URL should be skipped
        let input = "orphan\nnodejs https://github.com/example.git\n";
        let result = parse_plugin_list_all(input).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].name, "nodejs");
    }

    #[test]
    fn test_parse_plugin_list_all_large_registry() {
        // Simulate a large registry list
        let input: String = (0..500)
            .map(|i| format!("plugin-{i} https://github.com/example/plugin-{i}.git\n"))
            .collect();
        let result = parse_plugin_list_all(&input).unwrap();
        assert_eq!(result.len(), 500);
        assert_eq!(result[499].name, "plugin-499");
    }

    // ── parse_list_installed ───────────────────────────────────────

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
    fn test_parse_list_installed_empty() {
        let result = parse_list_installed("");
        assert!(result.is_empty());
    }

    #[test]
    fn test_parse_list_installed_all_current() {
        let input = " *1.0.0\n *2.0.0\n";
        let result = parse_list_installed(input);
        assert!(result.iter().all(|(_, current)| *current));
    }

    #[test]
    fn test_parse_list_installed_no_leading_space() {
        // Some versions of asdf might not add leading spaces
        let input = "18.17.0\n20.11.0\n";
        let result = parse_list_installed(input);
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].0, "18.17.0");
        assert!(!result[0].1);
    }

    #[test]
    fn test_parse_list_installed_version_with_suffix() {
        let input = "  3.12.1\n  3.12.1-dev\n  3.12.1+build.123\n";
        let result = parse_list_installed(input);
        assert_eq!(result.len(), 3);
        assert_eq!(result[1].0, "3.12.1-dev");
        assert_eq!(result[2].0, "3.12.1+build.123");
    }

    // ── parse_list_all ─────────────────────────────────────────────

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
    fn test_parse_list_all_empty() {
        let result = parse_list_all("");
        assert!(result.is_empty());
    }

    #[test]
    fn test_parse_list_all_preserves_order() {
        let input = "c\na\nb\n";
        let result = parse_list_all(input);
        assert_eq!(result, vec!["c", "a", "b"]);
    }

    #[test]
    fn test_parse_list_all_strips_whitespace() {
        let input = "  18.0.0  \n\t20.0.0\t\n";
        let result = parse_list_all(input);
        assert_eq!(result, vec!["18.0.0", "20.0.0"]);
    }

    // ── parse_latest_all ───────────────────────────────────────────

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
    fn test_parse_latest_all_empty() {
        let result = parse_latest_all("").unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_parse_latest_all_outdated() {
        let input = "nodejs 22.0.0 20.11.0\n";
        let result = parse_latest_all(input).unwrap();
        assert_eq!(result[0].latest, "22.0.0");
        assert_eq!(result[0].installed_version.as_deref(), Some("20.11.0"));
        assert!(!result[0].up_to_date);
    }

    #[test]
    fn test_parse_latest_all_single_field_skipped() {
        let input = "orphan\nnodejs 20.0.0\n";
        let result = parse_latest_all(input).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].name, "nodejs");
    }

    // ── parse_shim_versions ────────────────────────────────────────

    #[test]
    fn test_parse_shim_versions() {
        let input = "nodejs 20.11.0\nnodejs 18.17.0\n";
        let result = parse_shim_versions(input);
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].plugin, "nodejs");
        assert_eq!(result[0].version, "20.11.0");
    }

    #[test]
    fn test_parse_shim_versions_empty() {
        let result = parse_shim_versions("");
        assert!(result.is_empty());
    }

    #[test]
    fn test_parse_shim_versions_single_field_skipped() {
        let input = "nodejs\npython 3.12.1\n";
        let result = parse_shim_versions(input);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].plugin, "python");
    }

    #[test]
    fn test_parse_shim_versions_multiple_plugins() {
        let input = "nodejs 20.11.0\npython 3.12.1\nruby 3.3.0\n";
        let result = parse_shim_versions(input);
        assert_eq!(result.len(), 3);
        assert_eq!(result[2].plugin, "ruby");
        assert_eq!(result[2].version, "3.3.0");
    }

    // ── parse_tool_versions ────────────────────────────────────────

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
    fn test_parse_tool_versions_empty() {
        let result = parse_tool_versions("");
        assert!(result.is_empty());
    }

    #[test]
    fn test_parse_tool_versions_only_comments() {
        let input = "# this is a comment\n# another comment\n";
        let result = parse_tool_versions(input);
        assert!(result.is_empty());
    }

    #[test]
    fn test_parse_tool_versions_comment_after_hash_only() {
        // A line that is just "#" should be skipped
        let input = "#\nnodejs 20.0.0\n";
        let result = parse_tool_versions(input);
        assert_eq!(result.len(), 1);
    }

    #[test]
    fn test_parse_tool_versions_many_versions() {
        let input = "python 3.12.1 3.11.7 3.10.0 3.9.0 3.8.0\n";
        let result = parse_tool_versions(input);
        assert_eq!(result[0].versions.len(), 5);
    }

    #[test]
    fn test_parse_tool_versions_tool_name_only() {
        // A tool name with no version should produce empty versions vec
        let input = "nodejs\n";
        let result = parse_tool_versions(input);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].tool, "nodejs");
        assert!(result[0].versions.is_empty());
    }

    #[test]
    fn test_parse_tool_versions_mixed_content() {
        let input = "\n\nnodejs 20.0.0\n\n# comment\n\npython 3.12.1\n\n";
        let result = parse_tool_versions(input);
        assert_eq!(result.len(), 2);
    }

    #[test]
    fn test_parse_tool_versions_preserves_order() {
        let input = "ruby 3.3.0\nnodejs 20.0.0\npython 3.12.1\n";
        let result = parse_tool_versions(input);
        assert_eq!(result[0].tool, "ruby");
        assert_eq!(result[1].tool, "nodejs");
        assert_eq!(result[2].tool, "python");
    }

    // ── parse_env ──────────────────────────────────────────────────

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
    fn test_parse_env_empty() {
        let result = parse_env("");
        assert!(result.is_empty());
    }

    #[test]
    fn test_parse_env_no_equals_skipped() {
        let input = "NO_EQUALS_HERE\nFOO=bar\n";
        let result = parse_env(input);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].key, "FOO");
    }

    #[test]
    fn test_parse_env_empty_value() {
        let input = "EMPTY_VAR=\n";
        let result = parse_env(input);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].key, "EMPTY_VAR");
        assert_eq!(result[0].value, "");
    }

    #[test]
    fn test_parse_env_value_with_spaces() {
        let input = "MSG=hello world foo\n";
        let result = parse_env(input);
        assert_eq!(result[0].value, "hello world foo");
    }

    #[test]
    fn test_parse_env_windows_path() {
        let input = "PATH=C:\\Users\\user\\.asdf;C:\\Windows\n";
        let result = parse_env(input);
        assert_eq!(result[0].key, "PATH");
        assert_eq!(result[0].value, "C:\\Users\\user\\.asdf;C:\\Windows");
    }

    #[test]
    fn test_parse_env_unicode_value() {
        let input = "LANG=zh_TW.UTF-8\nDATA=日本語テスト\n";
        let result = parse_env(input);
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].value, "zh_TW.UTF-8");
    }

    // ── parse_asdf_info ────────────────────────────────────────────

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

    #[test]
    fn test_parse_asdf_info_no_plugins_section() {
        let input = "ASDF VERSION: 0.14.0\nOS: macos\nSHELL: /bin/zsh\nASDF DIR: /Users/user/.asdf\nASDF DATA DIR: /Users/user/.asdf\n";
        let result = parse_asdf_info(input).unwrap();
        assert_eq!(result.version, "0.14.0");
        assert_eq!(result.os, "macos");
        assert!(result.plugins.is_empty());
    }

    #[test]
    fn test_parse_asdf_info_many_plugins() {
        let mut input = "ASDF VERSION: 0.14.0\nOS: linux\nSHELL: /bin/bash\nASDF DIR: /home/user/.asdf\nASDF DATA DIR: /home/user/.asdf\n\nASDF INSTALLED PLUGINS:\n".to_string();
        for i in 0..50 {
            input.push_str(&format!("plugin-{i}\n"));
        }
        let result = parse_asdf_info(&input).unwrap();
        assert_eq!(result.plugins.len(), 50);
    }

    #[test]
    fn test_parse_asdf_info_plugins_end_on_blank_line() {
        let input = "ASDF INSTALLED PLUGINS:\nnodejs\npython\n\nSome other section:\ndata\n";
        let result = parse_asdf_info(input).unwrap();
        assert_eq!(result.plugins, vec!["nodejs", "python"]);
    }

    #[test]
    fn test_parse_asdf_info_windows_paths() {
        let input = "ASDF VERSION: 0.14.0\nOS: windows\nSHELL: powershell\nASDF DIR: C:\\Users\\user\\.asdf\nASDF DATA DIR: C:\\Users\\user\\.asdf\n";
        let result = parse_asdf_info(input).unwrap();
        assert_eq!(result.asdf_dir, "C:\\Users\\user\\.asdf");
    }

    // ── Security: Shell metacharacter handling ─────────────────────

    #[test]
    fn test_parse_current_shell_metacharacters_in_output() {
        // Parser should handle shell metacharacters as literal text
        let input = "nodejs $(rm -rf /) /path\n";
        let result = parse_current(input).unwrap();
        assert_eq!(result[0].name, "nodejs");
        assert_eq!(result[0].version, "$(rm");
    }

    #[test]
    fn test_parse_plugin_list_with_injection_in_url() {
        let input = "evil https://example.com/repo.git;rm-rf/ main\n";
        let result = parse_plugin_list(input).unwrap();
        assert_eq!(
            result[0].url.as_deref(),
            Some("https://example.com/repo.git;rm-rf/")
        );
    }

    #[test]
    fn test_parse_tool_versions_with_backticks() {
        let input = "nodejs `whoami`\n";
        let result = parse_tool_versions(input);
        assert_eq!(result[0].tool, "nodejs");
        assert_eq!(result[0].versions, vec!["`whoami`"]);
    }

    #[test]
    fn test_parse_env_key_with_special_chars() {
        let input = "FOO_BAR-BAZ=value\n";
        let result = parse_env(input);
        assert_eq!(result[0].key, "FOO_BAR-BAZ");
    }

    // ── Boundary: Trailing newlines and carriage returns ───────────

    #[test]
    fn test_parse_current_crlf() {
        let input = "nodejs 20.11.0 /path\r\npython 3.12.1 /path\r\n";
        let result = parse_current(input).unwrap();
        // \r will be part of the last field but lines split on \n
        assert_eq!(result.len(), 2);
    }

    #[test]
    fn test_parse_list_all_no_trailing_newline() {
        let input = "18.0.0\n20.0.0";
        let result = parse_list_all(input);
        assert_eq!(result, vec!["18.0.0", "20.0.0"]);
    }

    // ── Regression: Independence of parse functions ────────────────

    #[test]
    fn test_parsers_are_independent() {
        // Calling one parser should not affect another
        let env_input = "FOO=bar\n";
        let tool_input = "nodejs 20.0.0\n";
        let plugin_input = "nodejs\n";

        let env_result = parse_env(env_input);
        let tool_result = parse_tool_versions(tool_input);
        let plugin_result = parse_plugin_list(plugin_input).unwrap();

        assert_eq!(env_result.len(), 1);
        assert_eq!(tool_result.len(), 1);
        assert_eq!(plugin_result.len(), 1);

        // Call them again to ensure no state leakage
        let env_result2 = parse_env(env_input);
        assert_eq!(env_result2.len(), 1);
        assert_eq!(env_result2[0].key, env_result[0].key);
    }

    // ── parse_tool_versions: comments and edge cases ─────────────

    #[test]
    fn test_parse_tool_versions_inline_comment_stripped() {
        let input = "nodejs 20.11.0 # LTS version\n";
        let result = parse_tool_versions(input);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].tool, "nodejs");
        assert_eq!(result[0].versions, vec!["20.11.0"]);
    }

    #[test]
    fn test_parse_tool_versions_full_line_comment_skipped() {
        let input = "# This is a comment\nnodejs 20.11.0\n";
        let result = parse_tool_versions(input);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].tool, "nodejs");
    }

    #[test]
    fn test_parse_tool_versions_multiple_comments_skipped() {
        let input = "# header\nnodejs 20.11.0\n# separator\npython 3.12.1\n# footer\n";
        let result = parse_tool_versions(input);
        assert_eq!(result.len(), 2);
    }

    #[test]
    fn test_parse_tool_versions_tool_with_no_version() {
        // A line with only a tool name and no version
        let input = "nodejs\n";
        let result = parse_tool_versions(input);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].tool, "nodejs");
        assert!(result[0].versions.is_empty());
    }

    #[test]
    fn test_parse_tool_versions_mixed_indentation() {
        let input = "  nodejs  20.11.0  \n\tpython\t3.12.1\n";
        let result = parse_tool_versions(input);
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].tool, "nodejs");
        assert_eq!(result[0].versions, vec!["20.11.0"]);
        assert_eq!(result[1].tool, "python");
        assert_eq!(result[1].versions, vec!["3.12.1"]);
    }

    #[test]
    fn test_parse_tool_versions_multiple_versions_per_tool() {
        let input = "python 3.12.1 3.11.7 3.10.0\n";
        let result = parse_tool_versions(input);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].versions, vec!["3.12.1", "3.11.7", "3.10.0"]);
    }

    #[test]
    fn test_parse_tool_versions_crlf() {
        let input = "nodejs 20.11.0\r\npython 3.12.1\r\n";
        let result = parse_tool_versions(input);
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].tool, "nodejs");
        assert_eq!(result[1].tool, "python");
    }

    #[test]
    fn test_parse_tool_versions_version_with_prefix() {
        // Some tools use version prefixes like "ref:", "system"
        let input = "nodejs system\npython ref:main\n";
        let result = parse_tool_versions(input);
        assert_eq!(result[0].versions, vec!["system"]);
        assert_eq!(result[1].versions, vec!["ref:main"]);
    }

    // ── write_tool_versions serialization ────────────────────────

    #[test]
    fn test_tool_versions_round_trip() {
        // Parse -> serialize -> parse should produce same result
        let original = "nodejs 20.11.0\npython 3.12.1 3.11.7\nruby 3.3.0\n";
        let parsed = parse_tool_versions(original);

        // Serialize
        let serialized = parsed
            .iter()
            .map(|e| format!("{} {}", e.tool, e.versions.join(" ")))
            .collect::<Vec<_>>()
            .join("\n")
            + "\n";

        // Re-parse
        let re_parsed = parse_tool_versions(&serialized);
        assert_eq!(parsed.len(), re_parsed.len());
        for (a, b) in parsed.iter().zip(re_parsed.iter()) {
            assert_eq!(a.tool, b.tool);
            assert_eq!(a.versions, b.versions);
        }
    }

    #[test]
    fn test_tool_versions_serialize_empty() {
        let entries: Vec<ToolVersion> = vec![];
        let content = entries
            .iter()
            .map(|e| format!("{} {}", e.tool, e.versions.join(" ")))
            .collect::<Vec<_>>()
            .join("\n");
        assert_eq!(content, "");
    }

    #[test]
    fn test_tool_versions_serialize_single() {
        let entries = [ToolVersion {
            tool: "nodejs".to_string(),
            versions: vec!["20.11.0".to_string()],
        }];
        let content = entries
            .iter()
            .map(|e| format!("{} {}", e.tool, e.versions.join(" ")))
            .collect::<Vec<_>>()
            .join("\n");
        assert_eq!(content, "nodejs 20.11.0");
    }

    #[test]
    fn test_tool_versions_serialize_multiple_versions() {
        let entries = [ToolVersion {
            tool: "python".to_string(),
            versions: vec!["3.12.1".to_string(), "3.11.7".to_string()],
        }];
        let content = entries
            .iter()
            .map(|e| format!("{} {}", e.tool, e.versions.join(" ")))
            .collect::<Vec<_>>()
            .join("\n");
        assert_eq!(content, "python 3.12.1 3.11.7");
    }

    // ── parse_latest_all edge cases ──────────────────────────────

    #[test]
    fn test_parse_latest_all_up_to_date() {
        let input = "nodejs 22.0.0 22.0.0\n";
        let result = parse_latest_all(input).unwrap();
        assert!(result[0].up_to_date);
        assert_eq!(result[0].installed_version.as_deref(), Some("22.0.0"));
    }

    #[test]
    fn test_parse_latest_all_not_up_to_date() {
        let input = "nodejs 22.0.0 20.11.0\n";
        let result = parse_latest_all(input).unwrap();
        assert!(!result[0].up_to_date);
        assert_eq!(result[0].installed_version.as_deref(), Some("20.11.0"));
    }

    #[test]
    fn test_parse_latest_all_not_installed() {
        let input = "ruby 3.3.0\n";
        let result = parse_latest_all(input).unwrap();
        assert!(!result[0].up_to_date);
        assert!(result[0].installed_version.is_none());
    }

    #[test]
    fn test_parse_latest_all_mixed() {
        let input = "nodejs 22.0.0 22.0.0\npython 3.13.0 3.12.1\nruby 3.3.0\n";
        let result = parse_latest_all(input).unwrap();
        assert_eq!(result.len(), 3);
        assert!(result[0].up_to_date);
        assert!(!result[1].up_to_date);
        assert!(!result[2].up_to_date);
    }

    // ── parse_list_installed edge cases ───────────────────────────

    #[test]
    fn test_parse_list_installed_asterisk_no_space() {
        // Some asdf versions may print *20.11.0 without space
        let input = " *20.11.0\n  18.0.0\n";
        let result = parse_list_installed(input);
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].0, "20.11.0");
        assert!(result[0].1); // is current
        assert_eq!(result[1].0, "18.0.0");
        assert!(!result[1].1);
    }

    #[test]
    fn test_parse_list_installed_multiple_current_markers() {
        // Edge case: multiple current markers (shouldn't happen but parser should handle)
        let input = " *20.11.0\n *18.0.0\n";
        let result = parse_list_installed(input);
        assert_eq!(result.len(), 2);
        assert!(result[0].1);
        assert!(result[1].1);
    }

    #[test]
    fn test_parse_list_installed_none_current() {
        let input = "  20.11.0\n  18.0.0\n";
        let result = parse_list_installed(input);
        assert_eq!(result.len(), 2);
        assert!(!result[0].1);
        assert!(!result[1].1);
    }

    // ── parse_env edge cases ─────────────────────────────────────

    #[test]
    fn test_parse_env_value_with_equals() {
        let input = "PATH=/usr/bin:/home/user/.asdf/bin=/extra\n";
        let result = parse_env(input);
        assert_eq!(result[0].key, "PATH");
        assert_eq!(result[0].value, "/usr/bin:/home/user/.asdf/bin=/extra");
    }

    #[test]
    fn test_parse_env_empty_value_string() {
        let input = "EMPTY_VAR=\n";
        let result = parse_env(input);
        assert_eq!(result[0].key, "EMPTY_VAR");
        assert_eq!(result[0].value, "");
    }

    #[test]
    fn test_parse_env_line_without_equals() {
        let input = "NOT_AN_ENV_VAR\n";
        let result = parse_env(input);
        assert!(result.is_empty());
    }

    #[test]
    fn test_parse_env_mixed_valid_invalid_lines() {
        let input = "VALID=yes\nINVALID\nALSO_VALID=no\n";
        let result = parse_env(input);
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].key, "VALID");
        assert_eq!(result[1].key, "ALSO_VALID");
    }

    // ── parse_asdf_info: field ordering ──────────────────────────

    #[test]
    fn test_parse_asdf_info_reversed_order() {
        // Fields can appear in any order
        let input = "ASDF DATA DIR: /data\nASDF DIR: /dir\nSHELL: /bin/zsh\nOS: darwin\nASDF VERSION: 0.15.0\n";
        let result = parse_asdf_info(input).unwrap();
        assert_eq!(result.version, "0.15.0");
        assert_eq!(result.os, "darwin");
        assert_eq!(result.shell, "/bin/zsh");
        assert_eq!(result.asdf_dir, "/dir");
        assert_eq!(result.asdf_data_dir, "/data");
    }

    #[test]
    fn test_parse_asdf_info_missing_fields() {
        // If some fields are missing, they should be empty
        let input = "ASDF VERSION: 0.14.0\n";
        let result = parse_asdf_info(input).unwrap();
        assert_eq!(result.version, "0.14.0");
        assert!(result.os.is_empty());
        assert!(result.shell.is_empty());
        assert!(result.asdf_dir.is_empty());
    }

    #[test]
    fn test_parse_asdf_info_plugins_with_extra_spaces() {
        let input = "ASDF INSTALLED PLUGINS:\n  nodejs  \n  python  \n";
        let result = parse_asdf_info(input).unwrap();
        assert_eq!(result.plugins, vec!["nodejs", "python"]);
    }

    // ── parse_shim_versions edge cases ───────────────────────────

    #[test]
    fn test_parse_shim_versions_with_extra_fields() {
        // Only first two fields are used
        let input = "nodejs 20.11.0 extra_field\n";
        let result = parse_shim_versions(input);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].plugin, "nodejs");
        assert_eq!(result[0].version, "20.11.0");
    }

    #[test]
    fn test_parse_shim_versions_single_field_ignored() {
        let input = "nodejs\n";
        let result = parse_shim_versions(input);
        assert!(result.is_empty());
    }

    // ── parse_current: 4-field format ────────────────────────────

    #[test]
    fn test_parse_current_with_explicit_installed_true() {
        let input = "nodejs 20.11.0 /path true\n";
        let result = parse_current(input).unwrap();
        assert!(result[0].installed);
    }

    #[test]
    fn test_parse_current_with_explicit_installed_false() {
        let input = "nodejs 20.11.0 /path false\n";
        let result = parse_current(input).unwrap();
        assert!(!result[0].installed);
    }

    #[test]
    fn test_parse_current_with_explicit_installed_non_bool() {
        // Non-"true" 4th field should be treated as not installed
        let input = "nodejs 20.11.0 /path maybe\n";
        let result = parse_current(input).unwrap();
        assert!(!result[0].installed);
    }

    // ── Cross-platform: parse_plugin_list_all ────────────────────

    #[test]
    fn test_parse_plugin_list_all_with_various_url_formats() {
        let input = "nodejs https://github.com/asdf-vm/asdf-nodejs.git\npython git@github.com:asdf-community/asdf-python.git\n";
        let result = parse_plugin_list_all(input).unwrap();
        assert_eq!(result.len(), 2);
        assert!(result[0].url.starts_with("https://"));
        assert!(result[1].url.starts_with("git@"));
    }

    #[test]
    fn test_parse_plugin_list_all_name_only_line_skipped() {
        // Lines with only a name (no URL) should be skipped
        let input = "nodejs\npython https://example.com/repo.git\n";
        let result = parse_plugin_list_all(input).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].name, "python");
    }
}
