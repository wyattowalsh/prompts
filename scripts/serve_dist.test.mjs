import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";
import {
  DIST_SERVER_PROVENANCE_HEADER,
  DIST_SERVER_PROVENANCE_VALUE,
  startDistServer
} from "./serve_dist.mjs";

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), "serve_dist.mjs");

function httpRequest(port, path, { method = "GET" } = {}) {
  return new Promise((resolveRequest, rejectRequest) => {
    const outgoing = request(
      {
        host: "127.0.0.1",
        port,
        path,
        method,
        headers: { Connection: "close" }
      },
      (incoming) => {
        const chunks = [];
        incoming.on("data", (chunk) => chunks.push(chunk));
        incoming.once("end", () => {
          resolveRequest({
            body: Buffer.concat(chunks),
            headers: incoming.headers,
            status: incoming.statusCode
          });
        });
        incoming.once("error", rejectRequest);
      }
    );
    outgoing.once("error", rejectRequest);
    outgoing.end();
  });
}

function listeningPort(child) {
  return new Promise((resolvePort, rejectPort) => {
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(
      () => rejectPort(new Error(`server startup timed out: ${stderr}`)),
      5_000
    );
    timer.unref();

    const cleanup = () => {
      clearTimeout(timer);
      child.stdout.off("data", onStdout);
      child.stderr.off("data", onStderr);
      child.off("exit", onExit);
    };
    const onStdout = (chunk) => {
      stdout += chunk;
      const match = stdout.match(/listening on http:\/\/127\.0\.0\.1:(\d+)/u);
      if (!match) return;
      cleanup();
      resolvePort(Number(match[1]));
    };
    const onStderr = (chunk) => {
      stderr += chunk;
    };
    const onExit = (code, signal) => {
      cleanup();
      rejectPort(
        new Error(`server exited before listening: code=${code} signal=${signal} ${stderr}`)
      );
    };
    child.stdout.on("data", onStdout);
    child.stderr.on("data", onStderr);
    child.once("exit", onExit);
  });
}

describe("dist static server", () => {
  let sandbox;
  let distRoot;
  let server;

  before(async () => {
    sandbox = await mkdtemp(join(tmpdir(), "prompts-serve-dist-"));
    distRoot = join(sandbox, "dist");
    await mkdir(join(distRoot, "assets"), { recursive: true });
    await mkdir(join(distRoot, "nested"), { recursive: true });
    await Promise.all([
      writeFile(join(distRoot, "index.html"), "<h1>home</h1>\n"),
      writeFile(join(distRoot, "404.html"), "<h1>fixture not found</h1>\n"),
      writeFile(join(distRoot, "nested", "index.html"), "<h1>nested</h1>\n"),
      writeFile(join(distRoot, "assets", "app.js"), "export const ready = true;\n"),
      writeFile(join(distRoot, "assets", "app.mjs"), "export {};\n"),
      writeFile(join(distRoot, "assets", "app.css"), "body {}\n"),
      writeFile(join(distRoot, "assets", "data.json"), '{"ok":true}\n'),
      writeFile(join(distRoot, "assets", "mark.svg"), "<svg></svg>\n"),
      writeFile(join(distRoot, "assets", "font.woff2"), Buffer.from([0, 1, 2, 3])),
      writeFile(join(distRoot, "assets", "unknown.bin"), Buffer.from([4, 5, 6])),
      writeFile(join(distRoot, "assets", "large.txt"), Buffer.alloc(2 * 1024 * 1024, "x")),
      writeFile(join(sandbox, "outside.txt"), "outside secret\n"),
      writeFile(join(sandbox, "dist-secret.txt"), "sibling secret\n")
    ]);
    await symlink(join(sandbox, "outside.txt"), join(distRoot, "leak.txt"));
    server = await startDistServer({ root: distRoot, host: "127.0.0.1", port: 0 });
  });

  after(async () => {
    await server?.close();
    await rm(sandbox, { recursive: true, force: true });
  });

  it("streams concurrent requests with no-store provenance", async () => {
    const responses = await Promise.all(
      Array.from({ length: 24 }, (_, index) =>
        httpRequest(server.port, `/assets/app.js?request=${index}`)
      )
    );
    for (const response of responses) {
      assert.equal(response.status, 200);
      assert.equal(response.body.toString(), "export const ready = true;\n");
      assert.equal(response.headers["cache-control"], "no-store");
      assert.equal(
        response.headers[DIST_SERVER_PROVENANCE_HEADER.toLocaleLowerCase()],
        DIST_SERVER_PROVENANCE_VALUE
      );
    }
  });

  it("serves directory indexes and redirects their non-slash form", async () => {
    const home = await httpRequest(server.port, "/");
    const nested = await httpRequest(server.port, "/nested/");
    const redirect = await httpRequest(server.port, "/nested");
    assert.equal(home.status, 200);
    assert.equal(home.body.toString(), "<h1>home</h1>\n");
    assert.equal(nested.status, 200);
    assert.equal(nested.body.toString(), "<h1>nested</h1>\n");
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.location, "/nested/");
  });

  it("serves the committed-style 404 document with an actual 404 status", async () => {
    const missing = await httpRequest(server.port, "/missing-route/");
    const missingAsset = await httpRequest(server.port, "/assets/missing.js");
    for (const response of [missing, missingAsset]) {
      assert.equal(response.status, 404);
      assert.equal(response.body.toString(), "<h1>fixture not found</h1>\n");
      assert.equal(response.headers["content-type"], "text/html; charset=utf-8");
    }
  });

  it("keeps HEAD status and entity headers identical without sending a body", async () => {
    for (const path of ["/assets/app.js", "/missing-route/"]) {
      const get = await httpRequest(server.port, path);
      const head = await httpRequest(server.port, path, { method: "HEAD" });
      assert.equal(head.status, get.status);
      assert.equal(head.body.byteLength, 0);
      for (const header of ["cache-control", "content-length", "content-type", "last-modified"]) {
        assert.equal(head.headers[header], get.headers[header]);
      }
    }
  });

  it("rejects unsupported methods with an Allow contract", async () => {
    const response = await httpRequest(server.port, "/", { method: "POST" });
    assert.equal(response.status, 405);
    assert.equal(response.headers.allow, "GET, HEAD");
    assert.equal(response.body.toString(), "Method Not Allowed\n");
  });

  it("contains traversal attempts and symlinks that leave the dist root", async () => {
    const forbidden = [
      "/../outside.txt",
      "/%2e%2e/outside.txt",
      "/..%2foutside.txt",
      "/%2e%2e%5cdist-secret.txt",
      "/../dist-secret.txt",
      "/leak.txt"
    ];
    for (const path of forbidden) {
      const response = await httpRequest(server.port, path);
      assert.equal(response.status, 403, path);
      assert.doesNotMatch(response.body.toString(), /secret/u, path);
    }

    assert.equal((await httpRequest(server.port, "/%00")).status, 400);
    assert.equal((await httpRequest(server.port, "/%E0%A4%A")).status, 400);
  });

  it("uses an explicit MIME allowlist with an octet-stream fallback", async () => {
    const expected = new Map([
      ["/assets/app.js", "text/javascript; charset=utf-8"],
      ["/assets/app.mjs", "text/javascript; charset=utf-8"],
      ["/assets/app.css", "text/css; charset=utf-8"],
      ["/assets/data.json", "application/json; charset=utf-8"],
      ["/assets/mark.svg", "image/svg+xml; charset=utf-8"],
      ["/assets/font.woff2", "font/woff2"],
      ["/assets/unknown.bin", "application/octet-stream"]
    ]);
    for (const [path, contentType] of expected) {
      const response = await httpRequest(server.port, path, { method: "HEAD" });
      assert.equal(response.status, 200);
      assert.equal(response.headers["content-type"], contentType);
    }
  });

  it("survives a client abort during a streamed response", async () => {
    await new Promise((resolveAbort, rejectAbort) => {
      const outgoing = request({
        host: "127.0.0.1",
        port: server.port,
        path: "/assets/large.txt"
      });
      outgoing.once("response", (incoming) => {
        incoming.once("data", () => {
          incoming.destroy();
          resolveAbort();
        });
        incoming.once("error", (error) => {
          if (error.code === "ECONNRESET") resolveAbort();
          else rejectAbort(error);
        });
      });
      outgoing.once("error", rejectAbort);
      outgoing.end();
    });

    const response = await httpRequest(server.port, "/");
    assert.equal(response.status, 200);
  });

  it("closes its listener through the controller", async () => {
    const disposable = await startDistServer({ root: distRoot, host: "127.0.0.1", port: 0 });
    const port = disposable.port;
    assert.equal((await httpRequest(port, "/")).status, 200);
    await disposable.close();
    await assert.rejects(httpRequest(port, "/"), /ECONNREFUSED/u);
  });

  it("handles SIGTERM through the CLI shutdown path", async () => {
    const child = spawn(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        PLAYWRIGHT_DIST_ROOT: distRoot,
        PLAYWRIGHT_WEB_SERVER_HOST: "127.0.0.1",
        PLAYWRIGHT_WEB_SERVER_PORT: "0"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    try {
      const port = await listeningPort(child);
      assert.equal((await httpRequest(port, "/")).status, 200);
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      const [code, signal] = await exited;
      assert.equal(code, 0);
      assert.equal(signal, null);
      await assert.rejects(httpRequest(port, "/"), /ECONNREFUSED/u);
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
  });
});
