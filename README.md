# depintel

Dependency intelligence for complex monorepos.

Depintel helps teams understand declared and resolved dependencies across workspaces, detect conflicts, and prepare safer upgrades in legacy monorepos.

## Why depintel?

Upgrading large monorepos is hard because `package.json` files do not tell the whole truth.

Depintel starts by building a dependency inventory for each workspace:

- dependencies
- devDependencies
- peerDependencies
- overrides / resolutions
- resolved versions

This makes it easier to detect conflicts, explain upgrade blockers, and visualize dependency relationships across apps and packages.

## Packages

- `@lehuy/core` — core analysis engine
- `@lehuy/cli` — command-line interface

## Quick start

```bash
pnpm install
pnpm build
pnpm cli -- scan ./examples/sample-monorepo
```
