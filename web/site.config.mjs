import { isIP } from "node:net";

export const site = {
  name: "prompts",
  defaultBaseUrl: "http://127.0.0.1:4173/",
  repositoryUrl: "https://github.com/wyattowalsh/prompts",
  rawRepositoryUrl: "https://raw.githubusercontent.com/wyattowalsh/prompts/main",
  authorName: "Wyatt Walsh",
  language: "en",
  description: "Research-backed engineering recipes, patterns, and safety-first templates.",
  topicTags: [
    "prompt engineering",
    "AI workflows",
    "structured outputs",
    "tool calling",
    "retrieval augmented generation",
    "prompt injection defense",
    "LLM evaluation"
  ]
};

function normalizeHostname(hostname) {
  return hostname
    .toLowerCase()
    .replace(/^\[|\]$/gu, "")
    .replace(/\.+$/u, "");
}

function isLocalHostname(hostname) {
  const normalized = normalizeHostname(hostname);
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "::1" ||
    /^::ffff:7f[\da-f]{2}:/i.test(normalized) ||
    normalized.startsWith("127.")
  );
}

const SPECIAL_USE_DNS_SUFFIXES = [
  "alt",
  "arpa",
  "corp",
  "example",
  "home",
  "internal",
  "invalid",
  "lan",
  "local",
  "localdomain",
  "localhost",
  "onion",
  "test"
];
const RESERVED_EXAMPLE_DOMAINS = ["example.com", "example.net", "example.org"];
const DNS_LABEL = /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/u;

function hasDnsSuffix(hostname, suffix) {
  return hostname === suffix || hostname.endsWith(`.${suffix}`);
}

function isSpecialUseDnsHostname(hostname) {
  return (
    SPECIAL_USE_DNS_SUFFIXES.some((suffix) => hasDnsSuffix(hostname, suffix)) ||
    RESERVED_EXAMPLE_DOMAINS.some((suffix) => hasDnsSuffix(hostname, suffix))
  );
}

function isSyntacticallyPublicDnsHostname(hostname) {
  if (hostname.length > 253) return false;
  const labels = hostname.split(".");
  return labels.length >= 2 && labels.every((label) => DNS_LABEL.test(label));
}

function ipv4ToInteger(address) {
  return address
    .split(".")
    .map(Number)
    .reduce((value, octet) => value * 256 + octet, 0);
}

function isInIpv4Cidr(address, network, prefixLength) {
  const blockSize = 2 ** (32 - prefixLength);
  return Math.floor(address / blockSize) === Math.floor(network / blockSize);
}

const NON_PUBLIC_IPV4_CIDRS = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4]
].map(([network, prefixLength]) => [ipv4ToInteger(network), prefixLength]);

function isNonPublicIpv4(address) {
  const value = ipv4ToInteger(address);
  return NON_PUBLIC_IPV4_CIDRS.some(([network, prefixLength]) =>
    isInIpv4Cidr(value, network, prefixLength)
  );
}

function ipv6ToInteger(address) {
  const halves = address.toLowerCase().split("::");
  if (halves.length > 2) return null;

  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) return null;

  const groups = [...head, ...Array(missing).fill("0"), ...tail];
  if (groups.length !== 8) return null;
  return groups.reduce((value, group) => (value << 16n) | BigInt(`0x${group}`), 0n);
}

function isInIpv6Cidr(address, network, prefixLength) {
  const shift = 128n - BigInt(prefixLength);
  return address >> shift === network >> shift;
}

const IPV4_MAPPED_IPV6 = [ipv6ToInteger("::ffff:0:0"), 96];
const PUBLIC_IPV6_UNICAST = [ipv6ToInteger("2000::"), 3];
const NON_PUBLIC_IPV6_CIDRS = [
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20]
].map(([network, prefixLength]) => [ipv6ToInteger(network), prefixLength]);

function isNonPublicIpv6(address) {
  const value = ipv6ToInteger(address);
  if (value === null) return true;

  const [mappedNetwork, mappedPrefix] = IPV4_MAPPED_IPV6;
  if (isInIpv6Cidr(value, mappedNetwork, mappedPrefix)) return true;

  const [publicNetwork, publicPrefix] = PUBLIC_IPV6_UNICAST;
  if (!isInIpv6Cidr(value, publicNetwork, publicPrefix)) return true;

  return NON_PUBLIC_IPV6_CIDRS.some(([network, prefixLength]) =>
    isInIpv6Cidr(value, network, prefixLength)
  );
}

function isNonPublicIpHostname(hostname) {
  const normalized = normalizeHostname(hostname);
  const version = isIP(normalized);
  if (version === 4) return isNonPublicIpv4(normalized);
  if (version === 6) return isNonPublicIpv6(normalized);
  return false;
}

function assertPublicHostname(hostname) {
  const normalized = normalizeHostname(hostname);
  if (isLocalHostname(normalized)) {
    throw new Error("Publication canonical URLs cannot use localhost or a loopback address.");
  }

  if (isIP(normalized)) {
    if (isNonPublicIpHostname(normalized)) {
      throw new Error("Publication canonical URLs cannot use a non-public IP address.");
    }
    return;
  }

  if (!isSyntacticallyPublicDnsHostname(normalized)) {
    throw new Error("Publication canonical URLs require a valid, multi-label public DNS hostname.");
  }
  if (isSpecialUseDnsHostname(normalized)) {
    throw new Error("Publication canonical URLs cannot use a special-use or reserved DNS name.");
  }
}

function parseBaseUrl(value) {
  const trimmed = String(value).trim();
  const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Canonical URLs require an HTTP or HTTPS base URL.");
  }
  if (!parsed.pathname.endsWith("/")) parsed.pathname = `${parsed.pathname}/`;
  return parsed;
}

function assertPublicationBaseUrl(parsed) {
  if (parsed.protocol !== "https:") {
    throw new Error("Publication canonical URLs require an HTTPS base URL.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Publication canonical URLs cannot contain credentials.");
  }
  if (parsed.href.includes("?") || parsed.href.includes("#")) {
    throw new Error("Publication canonical URLs cannot contain a query string or fragment.");
  }
  if (parsed.pathname !== "/") {
    throw new Error("Publication canonical URLs require a root base path.");
  }
  assertPublicHostname(parsed.hostname);
}

function isPublicationBuild() {
  // WEB_PUBLICATION_BUILD=1 is the platform-neutral deploy contract. NODE_ENV
  // and VERCEL keep direct production invocations fail-closed as well.
  return (
    process.env.WEB_PUBLICATION_BUILD === "1" ||
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1"
  );
}

export function siteBaseUrl() {
  const publicationBuild = isPublicationBuild();
  // VERCEL_URL is deliberately excluded: it identifies the generated deployment,
  // including preview deployments, rather than the stable production origin.
  const raw = process.env.WEB_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!raw && publicationBuild) {
    throw new Error(
      "Publication builds need WEB_BASE_URL or VERCEL_PROJECT_PRODUCTION_URL for canonical URLs."
    );
  }
  const parsed = parseBaseUrl(raw || site.defaultBaseUrl);
  if (publicationBuild) assertPublicationBaseUrl(parsed);
  const normalized = parsed.href;

  // Optional publication guard: refuse baking *.vercel.app when a custom domain is required.
  if (
    process.env.WEB_REQUIRE_CUSTOM_DOMAIN === "1" &&
    publicationBuild &&
    parsed.hostname.toLowerCase().replace(/\.+$/u, "").endsWith(".vercel.app")
  ) {
    throw new Error(
      "WEB_REQUIRE_CUSTOM_DOMAIN=1 forbids *.vercel.app canonical hosts. Set WEB_BASE_URL to the public custom domain (e.g. https://prompts.w4w.dev)."
    );
  }

  return normalized;
}

export function absoluteUrl(route, baseUrl = siteBaseUrl()) {
  const path = route === "/" ? "" : route.replace(/^\//, "");
  return new URL(path, baseUrl).href;
}

function encodeRepoPath(path) {
  const normalized = path.replace(/^\.\//, "");
  if (normalized.split("/").includes("..")) {
    throw new Error(`Refusing to build repository URL for unsafe path: ${path}`);
  }
  return normalized
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function repositoryFileUrl(path, fragment = "") {
  return `${site.repositoryUrl}/blob/main/${encodeRepoPath(path)}${fragment}`;
}

export function rawRepositoryFileUrl(path) {
  return `${site.rawRepositoryUrl}/${encodeRepoPath(path)}`;
}
