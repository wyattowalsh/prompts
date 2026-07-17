/** Mirrors scripts/catalog_constants.py for extract classification. */

export const RECIPE_COUNT = 48;
export const PATTERN_NOTE_COUNT = 43;

export const CONTROL_NOTE_TITLES = new Set([
  "Source-Grounded Answer",
  "Web Research Brief",
  "Literature Scan",
  "Claim Checker",
  "JSON Extractor",
  "Classifier",
  "NER Extractor",
  "Tool-Use Planner",
  "RAG Answer Contract",
  "Prompt-Injection Scanner",
  "Eval-Set Generator",
  "Regression Judge",
  "Prompt Optimizer",
  "Panel Review"
]);

export const RECIPE_CLASS_BY_TITLE = {
  "Source-Grounded Answer": "research",
  "Web Research Brief": "research",
  "Literature Scan": "research",
  "Claim Checker": "research",
  "Citation Matrix": "research",
  "Disagreement Map": "research",
  "Executive Brief": "editorial",
  "Rewrite With Constraints": "editorial",
  "Style Transfer Without Examples": "editorial",
  "Dense Summary": "editorial",
  "FAQ Generator": "editorial",
  "Newsletter Draft": "editorial",
  "Code Review": "code",
  "Bug RCA": "code",
  "Unit Test Writer": "code",
  "Refactor Planner": "code",
  "PR Description": "code",
  "API Contract Explainer": "code",
  "JSON Extractor": "extract",
  "Table Normalizer": "extract",
  Classifier: "extract",
  "NER Extractor": "extract",
  "Sentiment Triage": "extract",
  "Synthetic Edge Cases": "extract",
  "PRD Drafter": "product",
  "User Story Splitter": "product",
  "Acceptance Criteria Writer": "product",
  "Launch Checklist": "product",
  "UX Review": "product",
  "Support Macro": "product",
  "Incident Summary": "ops",
  "Runbook Generator": "ops",
  "Log Triage": "ops",
  "Risk Register": "ops",
  "Decision Memo": "ops",
  "Meeting Action Extractor": "ops",
  "Tool-Use Planner": "tools",
  "RAG Answer Contract": "tools",
  "Prompt-Injection Scanner": "tools",
  "Eval-Set Generator": "tools",
  "Regression Judge": "tools",
  "Prompt Optimizer": "tools",
  "Plan-and-Solve": "reasoning",
  "Step-Back Answer": "reasoning",
  "Verification Pass": "reasoning",
  "Self-Refine Pass": "reasoning",
  "Panel Review": "reasoning",
  "Tradeoff Matrix": "reasoning"
};

export const LANE_TITLE_TO_KEY = {
  Research: "research",
  Writing: "writing",
  Coding: "coding",
  Data: "data",
  Product: "product",
  Operations: "operations",
  "Agent and Tool Workflows": "agents",
  Reasoning: "reasoning"
};

export const LANE_META = [
  { key: "research", title: "Research", color: "2563EB", order: 1 },
  { key: "writing", title: "Writing", color: "A855F7", order: 2 },
  { key: "coding", title: "Coding", color: "16A34A", order: 3 },
  { key: "data", title: "Data", color: "EAB308", order: 4 },
  { key: "product", title: "Product", color: "EC4899", order: 5 },
  { key: "operations", title: "Operations", color: "F97316", order: 6 },
  { key: "agents", title: "Agent and Tool Workflows", color: "06B6D4", order: 7 },
  { key: "reasoning", title: "Reasoning", color: "8B5CF6", order: 8 }
];

export const PATTERN_SECTION_TITLE_TO_KEY = {
  "Core Prompt Construction": "core-prompt-construction",
  "Reasoning and Search": "reasoning-and-search",
  "Verification and Iteration": "verification-and-iteration",
  "Task and Workflow Snippets": "task-and-workflow-snippets"
};
