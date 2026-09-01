<!-- markdownlint-disable MD013 MD041 -->

## Context

`facet: job|method` was the leftover of recipes vs patterns after the flatten.
The public catalog is already one type at `/` and `/catalog/<slug>/`.

## Decision

Delete the field. Do not keep a hidden internal enum. Lane plus modes plus
optional operational sections are enough.

## Consequences

Home loses the Job/Method chip row. Method-note fields stay optional on any
prompt. Search no longer indexes `job`/`method` as a facet token.
