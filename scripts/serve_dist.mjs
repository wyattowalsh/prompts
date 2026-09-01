#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

export const DIST_SERVER_PROVENANCE_HEADER = "X-Prompts-Dist-Server";
export const DIST_SERVER_PROVENANCE_VALUE = "1";

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"]
]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function isWithin(root, target) {
  const pathFromRoot = relative(root, target);
  return (
    pathFromRoot === "" ||
    (pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot))
  );
}

function requestPath(requestTarget) {
  if (
    typeof requestTarget !== "string" ||
    !requestTarget.startsWith("/") ||
    requestTarget.startsWith("//")
  ) {
    throw new HttpError(400, "Invalid request target");
  }

  const queryIndex = requestTarget.indexOf("?");
  const rawPath = queryIndex === -1 ? requestTarget : requestTarget.slice(0, queryIndex);
  const search = queryIndex === -1 ? "" : requestTarget.slice(queryIndex);

  // Encoded separators create platform-dependent interpretations. Static site
  // paths never need them, so reject them before decoding.
  if (/%(?:2f|5c)/iu.test(rawPath)) throw new HttpError(403, "Forbidden path");

  let pathname;
  try {
    pathname = decodeURIComponent(rawPath);
  } catch {
    throw new HttpError(400, "Malformed path encoding");
  }

  if (pathname.includes("\0")) throw new HttpError(400, "Invalid path");
  if (pathname.includes("\\")) throw new HttpError(403, "Forbidden path");
  if (pathname.split("/").includes("..")) throw new HttpError(403, "Forbidden path");

  return { pathname, rawPath, search };
}

async function existingPath(root, candidate) {
  if (!isWithin(root, candidate)) throw new HttpError(403, "Forbidden path");

  let metadata;
  try {
    metadata = await stat(candidate);
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "ENOTDIR") return null;
    throw error;
  }

  const canonical = await realpath(candidate);
  if (!isWithin(root, canonical)) throw new HttpError(403, "Forbidden path");
  return { canonical, metadata };
}

async function resolveRequest(root, requestTarget) {
  const { pathname, rawPath, search } = requestPath(requestTarget);
  const candidate = resolve(root, `.${pathname}`);
  const resolved = await existingPath(root, candidate);
  if (!resolved) return { kind: "missing" };

  if (resolved.metadata.isDirectory()) {
    if (!pathname.endsWith("/")) {
      return { kind: "redirect", location: `${rawPath}/${search}` };
    }
    const index = await existingPath(root, join(resolved.canonical, "index.html"));
    if (!index?.metadata.isFile()) return { kind: "missing" };
    return { kind: "file", ...index };
  }

  if (!resolved.metadata.isFile() || pathname.endsWith("/")) return { kind: "missing" };
  return { kind: "file", ...resolved };
}

function responseHeaders(extra = {}) {
  return {
    "Cache-Control": "no-store",
    [DIST_SERVER_PROVENANCE_HEADER]: DIST_SERVER_PROVENANCE_VALUE,
    ...extra
  };
}

function sendBuffer(request, response, status, body, contentType, extraHeaders = {}) {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body);
  response.writeHead(
    status,
    responseHeaders({
      "Content-Length": String(bytes.byteLength),
      "Content-Type": contentType,
      ...extraHeaders
    })
  );
  response.end(request.method === "HEAD" ? undefined : bytes);
}

async function sendFile(request, response, file, status) {
  response.writeHead(
    status,
    responseHeaders({
      "Content-Length": String(file.metadata.size),
      "Content-Type":
        MIME_TYPES.get(extname(file.canonical).toLocaleLowerCase()) ?? "application/octet-stream",
      "Last-Modified": file.metadata.mtime.toUTCString()
    })
  );

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  await pipeline(createReadStream(file.canonical), response);
}

function isExpectedDisconnect(error) {
  return (
    error?.code === "ECONNRESET" ||
    error?.code === "EPIPE" ||
    error?.code === "ERR_STREAM_PREMATURE_CLOSE"
  );
}

async function prepareRoot(root) {
  const canonicalRoot = await realpath(resolve(root));
  const rootMetadata = await stat(canonicalRoot);
  if (!rootMetadata.isDirectory()) throw new Error(`Dist root is not a directory: ${root}`);

  const notFound = await existingPath(canonicalRoot, join(canonicalRoot, "404.html"));
  if (!notFound?.metadata.isFile()) {
    throw new Error(`Dist root must contain a regular 404.html file: ${canonicalRoot}`);
  }
  return { canonicalRoot, notFound };
}

function destroyTrackedSockets(server, sockets) {
  for (const socket of sockets) socket.destroy();
  sockets.clear();
  server.closeAllConnections?.();
}

function closeServer(server, sockets, gracePeriodMs) {
  let forceTimer;
  return new Promise((resolveClose, rejectClose) => {
    let finished = false;
    const finish = (error) => {
      if (finished) return;
      finished = true;
      if (forceTimer) clearTimeout(forceTimer);
      destroyTrackedSockets(server, sockets);
      if (error && error.code !== "ERR_SERVER_NOT_RUNNING") rejectClose(error);
      else resolveClose();
    };

    if (!server.listening) {
      finish();
      return;
    }

    server.close(finish);
    server.closeIdleConnections?.();
    if (gracePeriodMs <= 0) {
      destroyTrackedSockets(server, sockets);
      return;
    }

    // Keep the failsafe referenced. An unref'd timer skipped keep-alive destroy and
    // hung past Playwright's 2s SIGTERM window.
    forceTimer = setTimeout(() => destroyTrackedSockets(server, sockets), gracePeriodMs);
  });
}

export async function startDistServer({
  root = "web/dist",
  host = "127.0.0.1",
  port = 4173,
  gracePeriodMs = 0,
  onError = (error) => console.error(error)
} = {}) {
  const { canonicalRoot, notFound } = await prepareRoot(root);
  const sockets = new Set();

  const server = createServer((request, response) => {
    void (async () => {
      if (request.method !== "GET" && request.method !== "HEAD") {
        sendBuffer(request, response, 405, "Method Not Allowed\n", "text/plain; charset=utf-8", {
          Allow: "GET, HEAD"
        });
        return;
      }

      const result = await resolveRequest(canonicalRoot, request.url ?? "/");
      if (result.kind === "redirect") {
        sendBuffer(request, response, 308, "", "text/plain; charset=utf-8", {
          Location: result.location
        });
      } else if (result.kind === "file") {
        await sendFile(request, response, result, 200);
      } else {
        await sendFile(request, response, notFound, 404);
      }
    })().catch((error) => {
      if (isExpectedDisconnect(error) || response.destroyed) return;
      if (!(error instanceof HttpError)) onError(error);
      if (response.headersSent) {
        response.destroy();
        return;
      }
      const status = error instanceof HttpError ? error.status : 500;
      const message = status === 500 ? "Internal Server Error" : error.message;
      sendBuffer(request, response, status, `${message}\n`, "text/plain; charset=utf-8");
    });
  });

  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
  });
  server.on("clientError", (_error, socket) => socket.destroy());

  await new Promise((resolveListen, rejectListen) => {
    const onError = (error) => {
      server.off("listening", onListening);
      rejectListen(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolveListen();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    await closeServer(server, sockets, gracePeriodMs);
    throw new Error("Static server did not expose a TCP address");
  }

  let closePromise;
  return {
    close() {
      closePromise ??= closeServer(server, sockets, gracePeriodMs);
      return closePromise;
    },
    host,
    port: address.port,
    root: canonicalRoot,
    server,
    url: `http://${host}:${address.port}`
  };
}

function validatedPort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error(`PLAYWRIGHT_WEB_SERVER_PORT must be an integer from 0 to 65535: ${value}`);
  }
  return port;
}

function validatedHost(value) {
  if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/iu.test(value) || value.includes("..")) {
    throw new Error(`PLAYWRIGHT_WEB_SERVER_HOST must be a hostname or IPv4 address: ${value}`);
  }
  return value;
}

function writeListeningLine(url, stdout = process.stdout) {
  const line = `prompts dist server listening on ${url}\n`;
  return new Promise((resolveWrite, rejectWrite) => {
    stdout.write(line, (error) => {
      if (error) rejectWrite(error);
      else resolveWrite();
    });
  });
}

export function installCliShutdownHandlers({
  close,
  exitProcess = (code) => process.exit(code),
  signalSource = process,
  signals = ["SIGINT", "SIGTERM"]
}) {
  let shuttingDown = false;
  let inFlight;
  const handlers = new Map();
  const removeHandlers = () => {
    for (const [signal, handler] of handlers) {
      signalSource.removeListener(signal, handler);
    }
    handlers.clear();
  };
  const shutdown = () => {
    if (shuttingDown) return inFlight;
    shuttingDown = true;
    removeHandlers();
    inFlight = Promise.resolve()
      .then(() => close())
      .then(
        () => 0,
        (error) => {
          console.error(error);
          return 1;
        }
      )
      .then((code) => {
        exitProcess(code);
      });
    return inFlight;
  };
  for (const signal of signals) {
    const handler = () => void shutdown();
    handlers.set(signal, handler);
    signalSource.once(signal, handler);
  }
  return { removeHandlers, shutdown };
}

async function main() {
  const controller = await startDistServer({
    root: process.env.PLAYWRIGHT_DIST_ROOT || "web/dist",
    host: validatedHost(process.env.PLAYWRIGHT_WEB_SERVER_HOST || "127.0.0.1"),
    port: validatedPort(process.env.PLAYWRIGHT_WEB_SERVER_PORT || "4173"),
    gracePeriodMs: 0
  });
  await writeListeningLine(controller.url);
  installCliShutdownHandlers({ close: () => controller.close() });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
