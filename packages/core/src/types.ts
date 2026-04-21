export type DependencySectionName =
  | "dependencies"
  | "devDependencies"
  | "peerDependencies"
  | "optionalDependencies";

export interface WorkspacePackageJson {
  name?: string;
  version?: string;
  private?: boolean;
  workspaces?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  overrides?: Record<string, string | Record<string, string>>;
  resolutions?: Record<string, string>;
}

export interface RootConfig {
  path: string;
  workspaces: string[];
  overrides: Record<string, string | Record<string, string>>;
  resolutions: Record<string, string>;
}

export interface WorkspaceInfo {
  name: string;
  version: string;
  private: boolean;
  path: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  optionalDependencies: Record<string, string>;
  overrides: Record<string, string | Record<string, string>>;
  resolutions: Record<string, string>;
}

export interface DependencyRecord {
  name: string;
  declaredVersion: string;
  resolvedVersion: string | null;
  section: DependencySectionName;
  overriddenByRoot: boolean;
  rootForcedVersion: string | null;
  resolvedBy: "none" | "root-override" | "root-resolution" | "lockfile";
}

export interface WorkspaceInventory {
  workspace: string;
  path: string;
  dependencies: DependencyRecord[];
  devDependencies: DependencyRecord[];
  peerDependencies: DependencyRecord[];
  optionalDependencies: DependencyRecord[];
  overrides: Record<string, string | Record<string, string>>;
  resolutions: Record<string, string>;
}

export interface InventoryResult {
  rootPath: string;
  rootOverrides: Record<string, string | Record<string, string>>;
  rootResolutions: Record<string, string>;
  workspaces: WorkspaceInventory[];
}
