use crate::asdf::executor::run_asdf;
use crate::asdf::parser;
use crate::config::context::ConfigContext;
use crate::error::AppError;
use crate::types::ShimVersion;

#[tauri::command]
pub async fn which_command(command: String) -> Result<String, AppError> {
    let ctx = ConfigContext::load();
    let output = run_asdf(
        &["which", &command],
        ctx.cwd.as_deref(),
        ctx.asdf_path.as_deref(),
    )
    .await?;
    Ok(output.stdout.trim().to_string())
}

#[tauri::command]
pub async fn shim_versions(command: String) -> Result<Vec<ShimVersion>, AppError> {
    let ctx = ConfigContext::load();
    let output = run_asdf(&["shimversions", &command], None, ctx.asdf_path.as_deref()).await?;
    Ok(parser::parse_shim_versions(&output.stdout))
}

#[tauri::command]
pub async fn reshim(name: String, version: String) -> Result<String, AppError> {
    let ctx = ConfigContext::load();
    let output = run_asdf(&["reshim", &name, &version], None, ctx.asdf_path.as_deref()).await?;
    Ok(output.stdout.trim().to_string())
}
