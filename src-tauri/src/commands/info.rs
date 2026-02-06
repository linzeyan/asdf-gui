use crate::asdf::executor::run_asdf;
use crate::asdf::parser;
use crate::config::context::ConfigContext;
use crate::error::AppError;
use crate::types::{AsdfInfo, EnvVar};

#[tauri::command]
pub async fn asdf_version() -> Result<String, AppError> {
    let ctx = ConfigContext::load();
    let output = run_asdf(&["version"], None, ctx.asdf_path.as_deref()).await?;
    Ok(output.stdout.trim().to_string())
}

#[tauri::command]
pub async fn asdf_info() -> Result<AsdfInfo, AppError> {
    let ctx = ConfigContext::load();
    let output = run_asdf(&["info"], None, ctx.asdf_path.as_deref()).await?;
    parser::parse_asdf_info(&output.stdout)
}

#[tauri::command]
pub async fn asdf_env(command: String) -> Result<Vec<EnvVar>, AppError> {
    let ctx = ConfigContext::load();
    let output = run_asdf(
        &["env", &command],
        ctx.cwd.as_deref(),
        ctx.asdf_path.as_deref(),
    )
    .await?;
    Ok(parser::parse_env(&output.stdout))
}
