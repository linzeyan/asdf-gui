export interface Plugin {
  name: string;
  url: string | null;
  git_ref: string | null;
}

export interface PluginRegistry {
  name: string;
  url: string;
}

export interface CurrentVersion {
  name: string;
  version: string;
  source: string;
  installed: boolean;
}

export interface LatestInfo {
  name: string;
  latest: string;
  installed_version: string | null;
  up_to_date: boolean;
}

export interface ShimVersion {
  plugin: string;
  version: string;
}

export interface EnvVar {
  key: string;
  value: string;
}

export interface AsdfInfo {
  version: string;
  os: string;
  shell: string;
  asdf_dir: string;
  asdf_data_dir: string;
  plugins: string[];
}

export interface ToolVersion {
  tool: string;
  versions: string[];
}

export type SetScope = "Local" | "Home" | "Parent";

export type InstallEvent =
  | { Stdout: string }
  | { Stderr: string }
  | { Finished: { success: boolean } };

export interface AppConfig {
  language: string;
  theme: string;
  asdf_binary_path: string | null;
  working_directory: string | null;
  keep_downloads: boolean;
  notifications: boolean;
  recent_projects: RecentProject[];
}

export interface RecentProject {
  path: string;
  name: string;
  last_opened: number;
}
