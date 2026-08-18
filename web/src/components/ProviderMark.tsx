import type { ChatProviderId } from "../lib/share-urls";
import { providerMarkProvenance } from "../lib/provider-mark-contract";

/** Uniform local monograms: provider identity remains in the adjacent visible label. */
export function ProviderMark({ id, size = 16 }: { id: ChatProviderId; size?: number }) {
  const provenance = providerMarkProvenance(id);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      data-provider-mark-kind={provenance.kind}
      data-provider-mark-glyph={provenance.glyph}
      data-provider-mark-source={provenance.source}
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <text
        x="12"
        y="12.5"
        fill="currentColor"
        fontFamily="system-ui, sans-serif"
        fontSize="10"
        fontWeight="750"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {provenance.glyph}
      </text>
    </svg>
  );
}
