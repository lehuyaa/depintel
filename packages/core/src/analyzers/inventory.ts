import path from "node:path";
import { discoverWorkspaces } from "../collectors/workspace.js";
import type {
  DependencyRecord,
  DependencySectionName,
  InventoryResult,
  WorkspaceInfo,
  WorkspaceInventory,
} from "../types.js";

function buildDependencyRecords(
  dependencies: Record<string, string>,
  section: DependencySectionName,
): DependencyRecord[] {
  return Object.entries(dependencies)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, declaredVersion]) => ({
      name,
      declaredVersion,
      resolvedVersion: null,
      section,
    }));
}

function toInventory(
  workspace: WorkspaceInfo,
  rootPath: string,
): WorkspaceInventory {
  return {
    workspace: workspace.name,
    path: path.relative(rootPath, workspace.path) || ".",
    dependencies: buildDependencyRecords(
      workspace.dependencies,
      "dependencies",
    ),
    devDependencies: buildDependencyRecords(
      workspace.devDependencies,
      "devDependencies",
    ),
    peerDependencies: buildDependencyRecords(
      workspace.peerDependencies,
      "peerDependencies",
    ),
    optionalDependencies: buildDependencyRecords(
      workspace.optionalDependencies,
      "optionalDependencies",
    ),
    overrides: workspace.overrides,
    resolutions: workspace.resolutions,
  };
}

export async function buildInventory(
  rootPath: string,
): Promise<InventoryResult> {
  const workspaces = await discoverWorkspaces(rootPath);

  return {
    rootPath,
    workspaces: workspaces.map((workspace) => toInventory(workspace, rootPath)),
  };
}
