export const site = {
  name: "Prompt Library",
  defaultBaseUrl: "http://127.0.0.1:4173/",
  repositoryUrl: "https://github.com/wyattowalsh/prompts",
  rawRepositoryUrl: "https://raw.githubusercontent.com/wyattowalsh/prompts/main",
  authorName: "Wyatt Walsh",
  language: "en",
  topicTags: [
    "prompt engineering",
    "AI prompts",
    "structured outputs",
    "tool calling",
    "retrieval augmented generation",
    "prompt injection defense",
    "LLM evaluation"
  ]
};

export function siteBaseUrl() {
  const raw =
    process.env.WEB_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (!raw && process.env.VERCEL === "1") {
    throw new Error(
      "Production Vercel builds need WEB_BASE_URL or exposed Vercel system URL variables for canonical URLs."
    );
  }
  const value = raw || site.defaultBaseUrl;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const normalized = withProtocol.endsWith("/") ? withProtocol : `${withProtocol}/`;

  // Optional production guard: refuse baking *.vercel.app when a custom domain is required.
  if (
    process.env.WEB_REQUIRE_CUSTOM_DOMAIN === "1" &&
    process.env.VERCEL === "1" &&
    /\.vercel\.app\/?$/i.test(normalized)
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
