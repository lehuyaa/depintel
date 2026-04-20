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
  workspaces: WorkspaceInventory[];
}
