use crate::asdf::executor::run_asdf;
use crate::asdf::parser;
use crate::config::app_config;
use crate::error::AppError;
use crate::types::{Plugin, PluginRegistry};

fn get_asdf_path() -> Option<String> {
    app_config::read_config()
        .ok()
        .and_then(|c| c.asdf_binary_path)
}

#[tauri::command]
pub async fn plugin_list(urls: bool, refs: bool) -> Result<Vec<Plugin>, AppError> {
    let asdf_path = get_asdf_path();
    let mut args = vec!["plugin", "list"];
    if urls {
        args.push("--urls");
    }
    if refs {
        args.push("--refs");
    }
    let output = run_asdf(&args, None, asdf_path.as_deref()).await?;
    parser::parse_plugin_list(&output.stdout)
}

#[tauri::command]
pub async fn plugin_list_all() -> Result<Vec<PluginRegistry>, AppError> {
    let asdf_path = get_asdf_path();
    let output = run_asdf(&["plugin", "list", "all"], None, asdf_path.as_deref()).await?;
    parser::parse_plugin_list_all(&output.stdout)
}

#[tauri::command]
pub async fn plugin_add(name: String, git_url: Option<String>) -> Result<String, AppError> {
    let asdf_path = get_asdf_path();
    let mut args = vec!["plugin", "add", name.as_str()];
    if let Some(ref url) = git_url {
        args.push(url.as_str());
    }
    let output = run_asdf(&args, None, asdf_path.as_deref()).await?;
    Ok(output.stdout.trim().to_string())
}

#[tauri::command]
pub async fn plugin_remove(name: String) -> Result<String, AppError> {
    let asdf_path = get_asdf_path();
    let output = run_asdf(&["plugin", "remove", &name], None, asdf_path.as_deref()).await?;
    Ok(output.stdout.trim().to_string())
}

#[tauri::command]
pub async fn plugin_update(name: Option<String>, all: bool) -> Result<String, AppError> {
    let asdf_path = get_asdf_path();
    let args = if all {
        vec!["plugin", "update", "--all"]
    } else if let Some(ref n) = name {
        vec!["plugin", "update", n.as_str()]
    } else {
        return Err(AppError::ParseError(
            "either name or --all must be specified".to_string(),
        ));
    };
    let output = run_asdf(&args, None, asdf_path.as_deref()).await?;
    Ok(output.stdout.trim().to_string())
}
