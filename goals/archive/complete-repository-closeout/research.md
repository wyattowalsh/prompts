<!-- markdownlint-disable MD013 -->

# Plan research — complete repository closeout

## Applied findings

The Plannotator revision request triggered a current official-doc research pass
and two independent repository/graph critiques. The revised plan applies these
findings:

- Maximal fan-out is limited by real worker, CPU/memory, browser-port,
  output-lock, Git-index, and per-host network capacity. Read-heavy leaves fan
  out; overlapping write-heavy work is serialized. This matches current
  [OpenAI Codex subagent guidance](https://developers.openai.com/codex/subagents).
- Migration proof includes field-level semantic lineage in addition to JSON
  Schema and count checks. Structural validation follows
  [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12), while human
  review owns semantic preservation.
- Every final source must still support the exact current claim; HTTP/link
  success alone is insufficient. Maintained standards are checked against their
  current release, including the
  [OWASP GenAI LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/).
- GitHub assurance derives an expected trigger/check/status manifest and checks
  exact-SHA workflow runs, check suites/runs/annotations, commit statuses, and
  complete logs. A successful conclusion with warning annotations is not clean
  proof. See the [workflow-run API](https://docs.github.com/en/rest/actions/workflow-runs),
  [check-run API](https://docs.github.com/en/rest/checks/runs), and
  [commit status API](https://docs.github.com/en/rest/commits/statuses).
- Vercel assurance proves the identity chain from pushed SHA to READY production
  deployment to current production alias, then checks a bounded runtime-log
  window. See [deployment listing](https://vercel.com/docs/cli/list),
  [inspection](https://vercel.com/docs/cli/inspect),
  [aliases](https://vercel.com/docs/cli/alias), and
  [runtime logs](https://vercel.com/docs/cli/logs).
- Cursor Cloud separates committed environment setup from exact-pushed-SHA live
  proof. The plan requires idempotent `.cursor/environment.json`, Build and repo
  identity, effective privacy/egress/retention, backend-proxied HTTP MCP where
  possible, redacted authentication evidence, and reconciled platform artifacts.
  See [setup](https://cursor.com/docs/cloud-agent/setup),
  [Builds](https://cursor.com/docs/cloud-agent/builds),
  [security and network](https://cursor.com/docs/cloud-agent/security-network),
  and [MCP capabilities](https://cursor.com/docs/cloud-agent/capabilities).
- Privacy assurance now covers the existing Recipe open-in-chat implementation,
  because live code currently places filled prompt text in provider query URLs.
  The safe contract copies locally and opens only provider home pages. Query
  strings can leak through histories, logs, caches, and referrers; see the
  [OWASP query-string exposure note](https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url).
- Manual accessibility uses a concrete keyboard, focus-order, visible-focus,
  status-message, reduced-motion, viewport, and theme matrix grounded in
  [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and its
  [status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

## Critique corrections

The revision also corrects plan-internal execution defects:

1. Local commits now precede exact-SHA clean-clone validation, which precedes
   push.
2. Real Cursor Cloud assurance runs after the exact SHA is pushed.
3. All writers finish before the integrated validation freeze.
4. Install, generated outputs, build, browser server, Git index, and remote API
   resources have explicit locks.
5. Playbook authors write goal-local proposals until the atomic source cutover,
   avoiding transient global-slug collisions with retiring records.
6. All barriers are executable nodes; repair uses monotonic epochs rather than
   backward DAG edges.
7. Source assurance covers both the initial 124 entries and every final-manifest
   addition/change.
8. Old-route proof covers all 91 typed details and both typed indexes, not a
   sample.
9. The final steward behavioral evaluation occurs after mandatory Playbook
   skill/reference/eval changes.
10. The machine graph treats worker receipts, exact joins, zero unresolved
    dependency references, zero overlapping write leases, and zero cycles as
    compile-time invariants.
