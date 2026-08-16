import { chromeTheme } from "./tokens.js";

const STEPS = [
  { className: "path-step path-step-fill", title: "Fill", detail: "Placeholder table" },
  { className: "path-step path-step-copy", title: "Copy", detail: "Text template" },
  { className: "path-step path-step-verify", title: "Verify", detail: "Safety and sources" }
];

export function Path({ theme }) {
  const t = chromeTheme(theme);

  return (
    <div
      tw="w-full h-full"
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: t.canvas,
        color: t.ink,
        fontFamily: "Geist",
        paddingTop: "calc(360px * 0.14)",
        paddingBottom: "calc(360px * 0.14)",
        paddingLeft: "calc(1280px * 0.045)",
        paddingRight: "calc(1280px * 0.045)"
      }}
    >
      <style>{`
        .path-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          width: 100%;
          height: 100%;
        }
        .path-step {
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid ${t.border};
          background: ${t.step};
        }
        .path-step::before {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          margin-bottom: 14px;
          border-radius: 999px;
          border: 1px solid ${t.border};
          background: ${t.canvas};
          color: ${t.accent};
          font-family: Geist;
          font-weight: 600;
          font-size: 18px;
          line-height: 1;
        }
        .path-step-fill::before { content: "1"; }
        .path-step-copy::before { content: "2"; }
        .path-step-verify::before { content: "3"; }
        .path-title {
          font-family: Geist;
          font-weight: 600;
          font-size: 32px;
          letter-spacing: -0.02em;
          line-height: 1.15;
          color: ${t.ink};
        }
        .path-detail {
          font-family: Geist;
          font-weight: 400;
          font-size: 20px;
          line-height: 1.35;
          color: ${t.muted};
        }
      `}</style>
      <div className="path-grid" tw="w-full h-full gap-8">
        {STEPS.map((step) => (
          <div key={step.title} className={step.className} tw="px-8 py-6">
            <div className="path-title">{step.title}</div>
            <div className="path-detail" tw="mt-2">
              {step.detail}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Path;
