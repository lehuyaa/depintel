import { promises as fs } from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { pathExists } from "../utils";

export interface PnpmLockfileDependencyEntry {
  specifier?: string;
  version?: string;
}

export interface PnpmLockfileImporter {
  dependencies?: Record<string, string | PnpmLockfileDependencyEntry>;
  devDependencies?: Record<string, string | PnpmLockfileDependencyEntry>;
  optionalDependencies?: Record<string, string | PnpmLockfileDependencyEntry>;
}

export interface PnpmLockfile {
  importers?: Record<string, PnpmLockfileImporter>;
  packages?: Record<string, unknown>;
}

export interface WorkspaceResolvedVersions {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  optionalDependencies: Record<string, string>;
}

function normalizeResolvedVersion(
  rawVersion: string | undefined,
): string | null {
  if (!rawVersion) {
    return null;
  }

  // Ví dụ:
  // "18.2.0" -> "18.2.0"
  // "18.2.0(react-dom@18.2.0)" -> "18.2.0"
  // "link:../shared-ui" -> null
  // "workspace:*" -> null
  // "file:../pkg.tgz" -> null
  if (
    rawVersion.startsWith("link:") ||
    rawVersion.startsWith("workspace:") ||
    rawVersion.startsWith("file:")
  ) {
    return null;
  }

  const peerSuffixIndex = rawVersion.indexOf("(");
  if (peerSuffixIndex >= 0) {
    return rawVersion.slice(0, peerSuffixIndex);
  }

  return rawVersion;
}

function extractVersion(
  entry: string | PnpmLockfileDependencyEntry | undefined,
): string | null {
  if (!entry) {
    return null;
  }

  if (typeof entry === "string") {
    return normalizeResolvedVersion(entry);
  }

  return normalizeResolvedVersion(entry.version);
}

function getImporterKey(rootPath: string, workspacePath: string): string {
  const relativePath = path.relative(rootPath, workspacePath);

  if (!relativePath || relativePath === "") {
    return ".";
  }

  return relativePath.split(path.sep).join("/");
}

function buildResolvedSection(
  section: Record<string, string | PnpmLockfileDependencyEntry> | undefined,
): Record<string, string> {
  if (!section) {
    return {};
  }

  const result: Record<string, string> = {};

  for (const [packageName, entry] of Object.entries(section)) {
    const resolvedVersion = extractVersion(entry);
    if (resolvedVersion) {
      result[packageName] = resolvedVersion;
    }
  }

  return result;
}

export async function readPnpmLockfile(
  rootPath: string,
): Promise<PnpmLockfile | null> {
  const lockfilePath = path.join(rootPath, "pnpm-lock.yaml");

  if (!(await pathExists(lockfilePath))) {
    return null;
  }

  const raw = await fs.readFile(lockfilePath, "utf8");
  return YAML.parse(raw) as PnpmLockfile;
}

export function getResolvedVersionsForWorkspace(
  lockfile: PnpmLockfile | null,
  rootPath: string,
  workspacePath: string,
): WorkspaceResolvedVersions {
  if (!lockfile?.importers) {
    return {
      dependencies: {},
      devDependencies: {},
      optionalDependencies: {},
    };
  }

  const importerKey = getImporterKey(rootPath, workspacePath);
  const importer = lockfile.importers[importerKey];

  if (!importer) {
    return {
      dependencies: {},
      devDependencies: {},
      optionalDependencies: {},
    };
  }

  return {
    dependencies: buildResolvedSection(importer.dependencies),
    devDependencies: buildResolvedSection(importer.devDependencies),
    optionalDependencies: buildResolvedSection(importer.optionalDependencies),
  };
}
