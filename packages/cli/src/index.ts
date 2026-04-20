import path from "node:path";
import process from "node:process";
import { buildInventory } from "@lehuy/core";

function printHelp(): void {
  console.log(
    `
depintel

Usage:
  depintel scan <path>
  depintel inventory <path>

Examples:
  depintel scan .
  depintel inventory ./examples/sample-monorepo
`.trim(),
  );
}

async function main(): Promise<void> {
  const [, , command, targetPathArg] = process.argv;

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  if (!targetPathArg) {
    console.error("Missing target path.");
    printHelp();
    process.exit(1);
  }

  const targetPath = path.resolve(process.cwd(), targetPathArg);

  switch (command) {
    case "scan":
    case "inventory": {
      const result = await buildInventory(targetPath);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error("depintel failed.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
});
