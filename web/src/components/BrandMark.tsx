/**
 * Brand mark SSOT — matches web/public/favicon.svg geometry.
 * Use decorative when adjacent text already names the product.
 */
export function BrandMark({
  size = 18,
  className = "",
  title = "prompts",
  decorative = false
}: {
  size?: number;
  className?: string;
  title?: string;
  /** When true, hide from a11y tree (next to visible product name). */
  decorative?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
    >
      <rect width="32" height="32" rx="8" fill="currentColor" className="brand-mark-tile" />
      {/* Bold geometric p — thick stems for 16px legibility */}
      <path
        fill="var(--primary-foreground, #f4f7fb)"
        className="brand-mark-glyph"
        d="M9 6h8.2c4.4 0 7.3 2.6 7.3 6.6 0 3.9-2.7 6.5-6.9 6.6H13.5V26H9V6zm4.5 3.6v6h3.9c2.1 0 3.3-1.1 3.3-3s-1.2-3-3.3-3h-3.9z"
      />
    </svg>
  );
}
