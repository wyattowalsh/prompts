import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const publicDir = resolve("public");
const retryableCodes = new Set(["ENOTEMPTY", "EBUSY", "EPERM"]);

for (let attempt = 0; attempt < 5; attempt += 1) {
  try {
    await rm(publicDir, { recursive: true, force: true });
    break;
  } catch (error) {
    if (!retryableCodes.has(error?.code) || attempt === 4) {
      throw error;
    }
    await new Promise((resolveRetry) => {
      setTimeout(resolveRetry, 100 * (attempt + 1));
    });
  }
}
