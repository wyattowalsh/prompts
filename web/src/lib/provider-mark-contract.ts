import type { ChatProviderId } from "./share-urls";

export type ProviderMarkProvenance = Readonly<{
  glyph: string;
  kind: "neutral-monogram";
  officialArtwork: false;
  runtimeNetwork: false;
  source: "repo-authored";
}>;

/**
 * Trust contract for the compact provider marks used by OpenInChat.
 *
 * Every cue is the same repo-authored circle plus a generic initial. The
 * adjacent visible provider name carries identity; these cues do not copy or
 * claim endorsement by official provider artwork.
 */
export const PROVIDER_MARK_PROVENANCE = Object.freeze({
  chatgpt: Object.freeze({
    glyph: "C",
    kind: "neutral-monogram",
    officialArtwork: false,
    runtimeNetwork: false,
    source: "repo-authored"
  }),
  claude: Object.freeze({
    glyph: "C",
    kind: "neutral-monogram",
    officialArtwork: false,
    runtimeNetwork: false,
    source: "repo-authored"
  }),
  gemini: Object.freeze({
    glyph: "G",
    kind: "neutral-monogram",
    officialArtwork: false,
    runtimeNetwork: false,
    source: "repo-authored"
  }),
  perplexity: Object.freeze({
    glyph: "P",
    kind: "neutral-monogram",
    officialArtwork: false,
    runtimeNetwork: false,
    source: "repo-authored"
  }),
  grok: Object.freeze({
    glyph: "G",
    kind: "neutral-monogram",
    officialArtwork: false,
    runtimeNetwork: false,
    source: "repo-authored"
  })
} satisfies Record<ChatProviderId, ProviderMarkProvenance>);

export function providerMarkProvenance(id: ChatProviderId): ProviderMarkProvenance {
  return PROVIDER_MARK_PROVENANCE[id];
}
