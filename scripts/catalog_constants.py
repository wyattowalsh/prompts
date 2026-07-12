"""Shared catalog cardinality and recipe classification constants."""

from __future__ import annotations

RECIPE_COUNT = 48
PATTERN_NOTE_COUNT = 43
SECTION_MAP_COUNT = 21

CONTROL_NOTE_RECIPES = frozenset(
    {
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
        "Panel Review",
    }
)

# Recipe class map for trust-boundary / validation lint (W3).
RECIPE_CLASS: dict[str, str] = {
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
    "Classifier": "extract",
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
    "Tradeoff Matrix": "reasoning",
}

# High-risk classes that should not rely solely on generic "trusted context" validation.
STRICT_VALIDATION_CLASSES = frozenset({"research", "code", "tools", "ops"})

# Case-insensitive class signals required somewhere in the copy-prompt haystack
# (Job / durable / paste zones / validation / output — not Sources bibliography).
CLASS_SIGNAL_PATTERNS: dict[str, str] = {
    "research": r"evidence|citation|source|missing|ground|claim",
    "code": r"test|fail|diff|verify|bug|lint|repro|patch",
    "tools": r"permission|retriev|eval|inject|tool|optim|metric|judge|failure|side effect|approv",
    "ops": r"risk|incident|reverse|blast|rollback|approval|severity|mitigat|owner|action",
}
