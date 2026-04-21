import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  RootConfig,
  WorkspaceInfo,
  WorkspacePackageJson,
} from "../types.js";
import { pathExists } from "../utils.js";

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function listDirectories(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dirPath, entry.name));
}

async function expandWorkspacePattern(
  rootPath: string,
  pattern: string,
): Promise<string[]> {
  if (!pattern.endsWith("/*")) {
    const candidate = path.join(rootPath, pattern);
    return (await pathExists(path.join(candidate, "package.json")))
      ? [candidate]
      : [];
  }

  const baseDir = pattern.slice(0, -2);
  const absoluteBaseDir = path.join(rootPath, baseDir);

  if (!(await pathExists(absoluteBaseDir))) {
    return [];
  }

  const dirs = await listDirectories(absoluteBaseDir);
  const matched: string[] = [];

  for (const dir of dirs) {
    if (await pathExists(path.join(dir, "package.json"))) {
      matched.push(dir);
    }
  }

  return matched;
}

export async function readRootConfig(rootPath: string): Promise<RootConfig> {
  const rootPackageJsonPath = path.join(rootPath, "package.json");
  const rootPackageJson =
    await readJsonFile<WorkspacePackageJson>(rootPackageJsonPath);

  return {
    path: rootPath,
    workspaces: rootPackageJson.workspaces ?? [],
    overrides: rootPackageJson.overrides ?? {},
    resolutions: rootPackageJson.resolutions ?? {},
  };
}

export async function discoverWorkspaces(
  rootPath: string,
): Promise<WorkspaceInfo[]> {
  const rootConfig = await readRootConfig(rootPath);
  const workspacePaths = new Set<string>();

  for (const pattern of rootConfig.workspaces) {
    const expanded = await expandWorkspacePattern(rootPath, pattern);
    for (const workspacePath of expanded) {
      workspacePaths.add(workspacePath);
    }
  }

  const result: WorkspaceInfo[] = [];

  for (const workspacePath of workspacePaths) {
    const packageJson = await readJsonFile<WorkspacePackageJson>(
      path.join(workspacePath, "package.json"),
    );

    result.push({
      name: packageJson.name ?? path.basename(workspacePath),
      version: packageJson.version ?? "0.0.0",
      private: packageJson.private ?? false,
      path: workspacePath,
      dependencies: packageJson.dependencies ?? {},
      devDependencies: packageJson.devDependencies ?? {},
      peerDependencies: packageJson.peerDependencies ?? {},
      optionalDependencies: packageJson.optionalDependencies ?? {},
      overrides: packageJson.overrides ?? {},
      resolutions: packageJson.resolutions ?? {},
    });
  }

  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}
