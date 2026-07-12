import { cp, mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const publicDir = resolve("public");
const pagefindDir = resolve(publicDir, "pagefind");
const temporaryIndexDir = resolve(".pagefind-index");
const pagefindBin = resolve(
  "node_modules",
  ".bin",
  process.platform === "win32" ? "pagefind.cmd" : "pagefind"
);

function runPagefind() {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(
      pagefindBin,
      [
        "--site",
        "public",
        "--output-path",
        temporaryIndexDir,
        "--force-language",
        "en",
        "--include-characters",
        "<>{}_/-"
      ],
      {
        stdio: "inherit",
        cwd: resolve(".")
      }
    );
    child.on("error", rejectRun);
    child.on("exit", (code) => {
      if (code === 0) {
        resolveRun();
      } else {
        rejectRun(new Error(`Pagefind exited with code ${code}`));
      }
    });
  });
}

await rm(temporaryIndexDir, { recursive: true, force: true });
await rm(pagefindDir, { recursive: true, force: true });
await runPagefind();
await mkdir(pagefindDir, { recursive: true });
await cp(temporaryIndexDir, pagefindDir, { recursive: true });
await rm(temporaryIndexDir, { recursive: true, force: true });
