import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const publicDir = resolve("public");

await rm(publicDir, { recursive: true, force: true });
