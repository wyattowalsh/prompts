export const pages = [
  {
    source: "README.md",
    route: "/",
    title: "Prompt Library",
    description:
      "Research-backed prompt engineering recipes, model/API controls, safety checks, eval patterns, and source-grounded templates for practical AI workflows.",
    required: true,
    index: true
  },
  {
    source: "CONTRIBUTING.md",
    route: "/contributing/",
    title: "Contributing",
    description:
      "Contribution guidance for improving the prompt library while preserving README.md as the canonical source of truth.",
    required: false,
    index: true
  },
  {
    source: "SECURITY.md",
    route: "/security/",
    title: "Security",
    description:
      "Security guidance for reporting issues and preserving safe prompt, tooling, and source-handling practices.",
    required: false,
    index: true
  },
  {
    source: "CODE_OF_CONDUCT.md",
    route: "/code-of-conduct/",
    title: "Code of Conduct",
    description: "Community conduct expectations for contributors to the prompt library.",
    required: false,
    index: true
  }
];
