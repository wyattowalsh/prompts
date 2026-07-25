export const CHAT_PROVIDERS = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    homeUrl: "https://chatgpt.com/",
    buildUrl: (q: string) => `https://chatgpt.com/?q=${encodeURIComponent(q)}`
  },
  {
    id: "claude",
    label: "Claude",
    homeUrl: "https://claude.ai/new",
    buildUrl: (q: string) => `https://claude.ai/new?q=${encodeURIComponent(q)}`
  },
  {
    id: "gemini",
    label: "Gemini",
    homeUrl: "https://gemini.google.com/app",
    buildUrl: (q: string) => `https://gemini.google.com/app?q=${encodeURIComponent(q)}`
  },
  {
    id: "perplexity",
    label: "Perplexity",
    homeUrl: "https://www.perplexity.ai/",
    buildUrl: (q: string) => `https://www.perplexity.ai/search/new?q=${encodeURIComponent(q)}`
  },
  {
    id: "grok",
    label: "Grok",
    homeUrl: "https://x.com/i/grok",
    buildUrl: (q: string) => `https://x.com/i/grok?text=${encodeURIComponent(q)}`
  }
] as const;

export function truncateQuery(text: string, max = 3500) {
  const value = text.trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
