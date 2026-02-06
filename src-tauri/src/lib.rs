mod asdf;
mod commands;
mod config;
mod error;
mod types;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Info
            commands::info::asdf_version,
            commands::info::asdf_info,
            commands::info::asdf_env,
            // Plugins
            commands::plugin::plugin_list,
            commands::plugin::plugin_list_all,
            commands::plugin::plugin_add,
            commands::plugin::plugin_remove,
            commands::plugin::plugin_update,
            // Versions
            commands::version::current,
            commands::version::install,
            commands::version::uninstall,
            commands::version::set_version,
            commands::version::latest,
            commands::version::latest_all,
            commands::version::list_installed,
            commands::version::list_all,
            commands::version::where_installed,
            // Shims
            commands::shim::which_command,
            commands::shim::shim_versions,
            commands::shim::reshim,
            // .tool-versions
            commands::tool_versions::read_tool_versions,
            commands::tool_versions::write_tool_versions,
            commands::tool_versions::get_tool_versions_path,
            // Settings
            commands::settings::read_config,
            commands::settings::write_config,
            commands::settings::set_working_directory,
            commands::settings::read_asdfrc,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
