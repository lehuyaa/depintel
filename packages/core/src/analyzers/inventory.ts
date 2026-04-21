import path from "node:path";
import {
  readPnpmLockfile,
  getResolvedVersionsForWorkspace,
} from "../collectors/pnpm-lockfile.js";
import { discoverWorkspaces, readRootConfig } from "../collectors/workspace.js";
import type {
  DependencyRecord,
  DependencySectionName,
  InventoryResult,
  WorkspaceInfo,
  WorkspaceInventory,
} from "../types.js";

function getRootForcedVersion(
  packageName: string,
  rootOverrides: Record<string, string | Record<string, string>>,
  rootResolutions: Record<string, string>,
): {
  forcedVersion: string | null;
  resolvedBy: "none" | "root-override" | "root-resolution";
} {
  const overrideValue = rootOverrides[packageName];

  if (typeof overrideValue === "string") {
    return {
      forcedVersion: overrideValue,
      resolvedBy: "root-override",
    };
  }

  const resolutionValue = rootResolutions[packageName];
  if (typeof resolutionValue === "string") {
    return {
      forcedVersion: resolutionValue,
      resolvedBy: "root-resolution",
    };
  }

  return {
    forcedVersion: null,
    resolvedBy: "none",
  };
}

function buildDependencyRecords(
  dependencies: Record<string, string>,
  section: DependencySectionName,
  rootOverrides: Record<string, string | Record<string, string>>,
  rootResolutions: Record<string, string>,
  resolvedVersions: Record<string, string>,
  allowRootForcedVersionAsResolved: boolean,
): DependencyRecord[] {
  return Object.entries(dependencies)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, declaredVersion]) => {
      const { forcedVersion, resolvedBy: rootResolvedBy } =
        getRootForcedVersion(name, rootOverrides, rootResolutions);

      const lockfileResolvedVersion = resolvedVersions[name] ?? null;

      return {
        name,
        declaredVersion,
        resolvedVersion:
          lockfileResolvedVersion ??
          (allowRootForcedVersionAsResolved ? forcedVersion : null) ??
          null,
        section,
        overriddenByRoot: forcedVersion !== null,
        rootForcedVersion: forcedVersion,
        resolvedBy: lockfileResolvedVersion ? "lockfile" : rootResolvedBy,
      };
    });
}

function toInventory(
  workspace: WorkspaceInfo,
  rootPath: string,
  rootOverrides: Record<string, string | Record<string, string>>,
  rootResolutions: Record<string, string>,
  lockfile: Awaited<ReturnType<typeof readPnpmLockfile>>,
): WorkspaceInventory {
  const resolved = getResolvedVersionsForWorkspace(
    lockfile,
    rootPath,
    workspace.path,
  );

  return {
    workspace: workspace.name,
    path: path.relative(rootPath, workspace.path) || ".",
    dependencies: buildDependencyRecords(
      workspace.dependencies,
      "dependencies",
      rootOverrides,
      rootResolutions,
      resolved.dependencies,
      true,
    ),
    devDependencies: buildDependencyRecords(
      workspace.devDependencies,
      "devDependencies",
      rootOverrides,
      rootResolutions,
      resolved.devDependencies,
      true,
    ),
    peerDependencies: buildDependencyRecords(
      workspace.peerDependencies,
      "peerDependencies",
      rootOverrides,
      rootResolutions,
      {},
      false,
    ),
    optionalDependencies: buildDependencyRecords(
      workspace.optionalDependencies,
      "optionalDependencies",
      rootOverrides,
      rootResolutions,
      resolved.optionalDependencies,
      true,
    ),
    overrides: workspace.overrides,
    resolutions: workspace.resolutions,
  };
}

export async function buildInventory(
  rootPath: string,
): Promise<InventoryResult> {
  const rootConfig = await readRootConfig(rootPath);
  const workspaces = await discoverWorkspaces(rootPath);
  const lockfile = await readPnpmLockfile(rootPath);

  return {
    rootPath,
    rootOverrides: rootConfig.overrides,
    rootResolutions: rootConfig.resolutions,
    workspaces: workspaces.map((workspace) =>
      toInventory(
        workspace,
        rootPath,
        rootConfig.overrides,
        rootConfig.resolutions,
        lockfile,
      ),
    ),
  };
}
