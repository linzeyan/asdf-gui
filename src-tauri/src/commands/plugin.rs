use crate::asdf::executor::run_asdf;
use crate::asdf::parser;
use crate::config::context::ConfigContext;
use crate::error::AppError;
use crate::types::{Plugin, PluginRegistry};

#[tauri::command]
pub async fn plugin_list(urls: bool, refs: bool) -> Result<Vec<Plugin>, AppError> {
    let ctx = ConfigContext::load();
    let mut args = vec!["plugin", "list"];
    if urls {
        args.push("--urls");
    }
    if refs {
        args.push("--refs");
    }
    let output = run_asdf(&args, None, ctx.asdf_path.as_deref()).await?;
    parser::parse_plugin_list(&output.stdout)
}

#[tauri::command]
pub async fn plugin_list_all() -> Result<Vec<PluginRegistry>, AppError> {
    let ctx = ConfigContext::load();
    let output = run_asdf(&["plugin", "list", "all"], None, ctx.asdf_path.as_deref()).await?;
    parser::parse_plugin_list_all(&output.stdout)
}

#[tauri::command]
pub async fn plugin_add(name: String, git_url: Option<String>) -> Result<String, AppError> {
    let ctx = ConfigContext::load();
    let mut args = vec!["plugin", "add", name.as_str()];
    if let Some(ref url) = git_url {
        args.push(url.as_str());
    }
    let output = run_asdf(&args, None, ctx.asdf_path.as_deref()).await?;
    Ok(output.stdout.trim().to_string())
}

#[tauri::command]
pub async fn plugin_remove(name: String) -> Result<String, AppError> {
    let ctx = ConfigContext::load();
    let output = run_asdf(&["plugin", "remove", &name], None, ctx.asdf_path.as_deref()).await?;
    Ok(output.stdout.trim().to_string())
}

#[tauri::command]
pub async fn plugin_update(name: Option<String>, all: bool) -> Result<String, AppError> {
    let ctx = ConfigContext::load();
    let args = if all {
        vec!["plugin", "update", "--all"]
    } else if let Some(ref n) = name {
        vec!["plugin", "update", n.as_str()]
    } else {
        return Err(AppError::ParseError(
            "either name or --all must be specified".to_string(),
        ));
    };
    let output = run_asdf(&args, None, ctx.asdf_path.as_deref()).await?;
    Ok(output.stdout.trim().to_string())
}
