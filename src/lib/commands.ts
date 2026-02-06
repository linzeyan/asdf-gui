import { invoke, Channel } from "@tauri-apps/api/core";
import type {
  Plugin,
  PluginRegistry,
  CurrentVersion,
  LatestInfo,
  ShimVersion,
  EnvVar,
  AsdfInfo,
  ToolVersion,
  SetScope,
  InstallEvent,
  AppConfig,
} from "./types";

// Info
export const asdfVersion = () => invoke<string>("asdf_version");
export const asdfInfo = () => invoke<AsdfInfo>("asdf_info");
export const asdfEnv = (command: string) =>
  invoke<EnvVar[]>("asdf_env", { command });

// Plugins
export const pluginList = (urls: boolean, refs: boolean) =>
  invoke<Plugin[]>("plugin_list", { urls, refs });
export const pluginListAll = () => invoke<PluginRegistry[]>("plugin_list_all");
export const pluginAdd = (name: string, gitUrl?: string) =>
  invoke<string>("plugin_add", { name, gitUrl });
export const pluginRemove = (name: string) =>
  invoke<string>("plugin_remove", { name });
export const pluginUpdate = (name?: string, all?: boolean) =>
  invoke<string>("plugin_update", { name, all: all ?? false });

// Versions
export const currentVersions = (name?: string) =>
  invoke<CurrentVersion[]>("current", { name });
export const uninstallVersion = (name: string, version: string) =>
  invoke<string>("uninstall", { name, version });
export const setVersion = (name: string, versions: string[], scope: SetScope) =>
  invoke<string>("set_version", { name, versions, scope });
export const latestVersion = (name: string, filter?: string) =>
  invoke<string>("latest", { name, filter });
export const latestAll = () => invoke<LatestInfo[]>("latest_all");
export const listInstalled = (name: string) =>
  invoke<string[]>("list_installed", { name });
export const listAll = (name: string, filter?: string) =>
  invoke<string[]>("list_all", { name, filter });
export const whereInstalled = (name: string, version?: string) =>
  invoke<string>("where_installed", { name, version });

// Versions — streaming install
export function installVersion(
  name: string | null,
  version: string | null,
  keepDownload: boolean,
  cwd: string | null,
  onEvent: (event: InstallEvent) => void,
): Promise<void> {
  const channel = new Channel<InstallEvent>();
  channel.onmessage = onEvent;
  return invoke("install", {
    name,
    version,
    keepDownload,
    cwd,
    onOutput: channel,
  });
}

// Shims
export const whichCommand = (command: string) =>
  invoke<string>("which_command", { command });
export const shimVersions = (command: string) =>
  invoke<ShimVersion[]>("shim_versions", { command });
export const reshim = (name: string, version: string) =>
  invoke<string>("reshim", { name, version });

// .tool-versions
export const readToolVersions = (path: string) =>
  invoke<ToolVersion[]>("read_tool_versions", { path });
export const writeToolVersions = (path: string, entries: ToolVersion[]) =>
  invoke<void>("write_tool_versions", { path, entries });
export const getToolVersionsPath = (scope: SetScope) =>
  invoke<string>("get_tool_versions_path", { scope });

// Settings
export const readConfig = () => invoke<AppConfig>("read_config");
export const writeConfig = (config: AppConfig) =>
  invoke<void>("write_config", { config });
export const setWorkingDirectory = (path: string) =>
  invoke<AppConfig>("set_working_directory", { path });
export const readAsdfrc = () => invoke<[string, string][]>("read_asdfrc");
