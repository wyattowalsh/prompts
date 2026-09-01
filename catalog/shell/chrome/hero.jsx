import { chromeTheme } from "./tokens.js";

export function Hero({ theme }) {
  const t = chromeTheme(theme);

  return (
    <div
      tw="w-full h-full flex flex-col justify-center"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        backgroundColor: t.canvas,
        color: t.ink,
        fontFamily: "Geist",
        paddingTop: "calc(360px * 0.18)",
        paddingBottom: "calc(360px * 0.18)",
        paddingLeft: "calc(1280px * 0.055)",
        paddingRight: "calc(1280px * 0.055)"
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "calc(1280px * 0.055)",
          right: "calc(1280px * 0.055)",
          bottom: "calc(360px * 0.26)",
          height: "1px",
          backgroundColor: t.rule,
          zIndex: 0,
          opacity: 0.85
        }}
      />
      <div tw="flex flex-col" style={{ display: "flex", flexDirection: "column", zIndex: 1 }}>
        <div
          style={{
            fontFamily: "Geist",
            fontWeight: 800,
            fontSize: 72,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: t.ink
          }}
        >
          Prompt Library
        </div>
        <div
          tw="mt-4"
          style={{
            fontFamily: "Geist",
            fontWeight: 600,
            fontSize: 28,
            letterSpacing: "-0.01em",
            lineHeight: 1.35,
            color: t.muted
          }}
        >
          Research-backed prompts · copy · adapt · verify
        </div>
      </div>
    </div>
  );
}

export default Hero;
