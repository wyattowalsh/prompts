#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkCatalogReadme } from "./catalog_readme.mjs";

export { checkCatalogReadme } from "./catalog_readme.mjs";

async function main() {
  const result = await checkCatalogReadme();
  console.log(`catalog README check ok: ${result.expectedReadmePath}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
