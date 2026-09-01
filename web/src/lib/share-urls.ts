export type ChatProviderId = "chatgpt" | "claude" | "gemini" | "perplexity" | "grok";

export type ChatProvider = {
  id: ChatProviderId;
  label: string;
  homeUrl: string;
  /** Brand accent used for chip chrome */
  brand: string;
  brandSoft: string;
};

export const CHAT_PROVIDERS: readonly ChatProvider[] = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    homeUrl: "https://chatgpt.com/",
    brand: "#10a37f",
    brandSoft: "color-mix(in srgb, #10a37f 14%, var(--card))"
  },
  {
    id: "claude",
    label: "Claude",
    homeUrl: "https://claude.ai/new",
    brand: "#d97706",
    brandSoft: "color-mix(in srgb, #d97706 14%, var(--card))"
  },
  {
    id: "gemini",
    label: "Gemini",
    homeUrl: "https://gemini.google.com/app",
    brand: "#4285f4",
    brandSoft: "color-mix(in srgb, #4285f4 14%, var(--card))"
  },
  {
    id: "perplexity",
    label: "Perplexity",
    homeUrl: "https://www.perplexity.ai/",
    brand: "#20808d",
    brandSoft: "color-mix(in srgb, #20808d 14%, var(--card))"
  },
  {
    id: "grok",
    label: "Grok",
    homeUrl: "https://x.com/i/grok",
    brand: "var(--foreground)",
    brandSoft: "color-mix(in srgb, var(--foreground) 8%, var(--card))"
  }
] as const;
