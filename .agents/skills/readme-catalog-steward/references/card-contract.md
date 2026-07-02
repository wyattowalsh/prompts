<!-- markdownlint-disable MD013 -->

# README Recipe And Pattern Contract

Use this reference when adding or revising a README prompt recipe or supporting
pattern note.

## Required Fields

Every prompt recipe must include:

- Use for
- Copy prompt
- Fill these in
- Expected output
- Upgrade when
- Safety/eval checks
- Sources

Every pattern note must include the fields that fit its format:

- Definition
- Best use
- Avoid when
- Copyable skeleton or prompt recipe link
- Model/API controls
- Cost and latency
- Failure modes
- Evidence tier
- Source type
- Eval required
- Caveat
- Clickable sources

If a pattern cannot safely provide a copyable skeleton, say why instead of
leaving the field implicit.

Run the canonical validation block in
[AGENTS.md § Validation](../../../../AGENTS.md#validation). The recipe contract
linter enforces required recipe fields plus Prompt Index and Section Map link
completeness.

## Template Hygiene

Templates should clearly separate:

- durable instructions
- trusted context
- untrusted input
- tool permissions and side effects
- output contract
- validation before final answer

Use explicit delimiters for untrusted input. Do not ask the model to obey,
summarize, transform, or execute untrusted text without first defining the trust
boundary and output contract.

## Evidence Tiers

| Tier | Use When | Caveat |
| --- | --- | --- |
| `Strong` | Multiple task-relevant studies, official docs, or repeatable evals support the method | Still require local evals before production use |
| `Moderate` | One or more credible papers or official docs support the pattern for similar tasks | Call out model and benchmark age |
| `Emerging` | Promising research exists but evidence is narrow, recent, or model-specific | Keep templates conservative |
| `Community` | Maintained practitioner use exists without strong task-specific evidence | Label as practice, not proof |
| `Experimental` | Speculative, high-cost, or fragile pattern with limited support | Require sandbox evals and alternatives |

Distinguish "the method has evidence" from "this exact template is proven."

## Reasoning Visibility

Do not make visible long chain-of-thought the default output. Prefer one of:

- private reasoning or provider-specific thinking controls
- concise rationale
- answer schema with evidence fields
- verification checklist
- citations and source snippets within copyright limits
- tool trace or calculation trace when the trace is safe to expose

If a source recommends step-by-step reasoning, adapt the README wording to avoid
requiring hidden deliberation to be printed.

## Recipe And Pattern Review Checklist

- [ ] The recipe or pattern name and anchor are stable.
- [ ] The recipe can be copied without surrounding research prose.
- [ ] The pattern note states when not to use the method.
- [ ] Sources are method-specific, not generic homepages.
- [ ] Provider/model-specific behavior is caveated.
- [ ] Cost and latency are not hand-waved.
- [ ] Failure modes include injection or source-trust issues where relevant.
- [ ] Eval required is explicit and realistic.
- [ ] Templates avoid emotional pressure, verbosity inflation, and persona
      theater unless task-specific evidence supports them.
