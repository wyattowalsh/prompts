<!-- markdownlint-disable MD013 -->

# Accepted decision addendum

These decisions were accepted during the post-facts design interview and narrow the accepted facts without reopening cluster membership. They are binding for Plan v2 and the execution graph.

1. **Functional redirects:** retain exactly `/sources/` → `/explore/?scope=sources` and `/research/` → `/explore/` because they are independently owned Explore shortcuts. They are not catalog compatibility, and the catalog still has zero redirects, aliases, compatibility anchors, legacy shells, dual readers, or adapters. Ordinary platform slash/`cleanUrls` normalization is separate.
2. **README and bounded composer:** each Playbook has one to six stable author-approved modes with exactly one default/selection and zero to twelve typed optional modules, deterministic ordering, explicit `requires`/`conflicts`, invalid-state explanation/reset, golden mode outputs, pairwise module coverage, and safe ID-only query canonicalization. README renders one Playbook card, its finite mode/module table, one default copyable composition, and a web-composer link. It does not reproduce retired cards or a variants dump.
3. **Repository-wide Open-in-Chat:** explicit activation copies the current prompt locally, then opens only the provider's base chat page. Provider URLs and referrers contain no prompt. Copy failure is announced and the UI never claims that content was transferred when it was not. The contract applies to Recipes and Playbooks.

If later evidence contradicts one of these decisions materially, execution returns to the decision gate. Workers may not silently reinterpret or expand it.
