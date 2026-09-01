<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## RENAMED Requirements

- FROM: `### Requirement: Share destinations preserve Unicode within a bounded URL`
- TO: `### Requirement: Open-in-Chat copies then opens provider home URLs`

## MODIFIED Requirements

### Requirement: Catalog filtering announces concise result changes

The catalog home SHALL expose one atomic polite status message for filter-result
counts. The complete dynamic result-card container MUST NOT be a live region.
Counts MUST be prompt totals. They MUST NOT be split as recipe vs pattern
counts or grouped as those types.

#### Scenario: A user changes the catalog search query

- **WHEN** the visible prompt count changes
- **THEN** assistive technology receives one concise count summary without
  re-announcing every matching card
- **AND** the summary does not report separate recipe and pattern totals

### Requirement: Open-in-Chat copies then opens provider home URLs

Open-in-Chat SHALL copy the current filled prompt in the browser and MUST open
the provider at its configured `homeUrl`. The opened URL MUST NOT contain the
prompt, pasted values, or fill state in any query component. Shareable catalog
URLs MAY include only `?mode=<id>`. The application MUST NOT construct provider
URLs that embed prompt text, so Unicode/grapheme truncation of provider query
payloads MUST NOT be used as the privacy control.

#### Scenario: A prompt within the URL budget contains non-ASCII text and emoji

- **WHEN** the user invokes Open-in-Chat with a filled prompt that contains
  non-ASCII text and emoji
- **THEN** the clipboard receives that text without corruption
- **AND** the opened provider URL is the provider `homeUrl` with no prompt
  query payload

#### Scenario: A filled prompt exceeds the destination URL budget

- **WHEN** the filled prompt is longer than any previous provider URL budget
- **THEN** Open-in-Chat still copies the full prompt locally
- **AND** the opened URL remains the provider `homeUrl` without truncation
  into a query string

### Requirement: Small interactive text and focus cues remain contrast-safe

Small prompt-card calls to action and provider labels SHALL use text colors with
at least 4.5:1 contrast in supported light and dark themes, including hover
states. Keyboard focus indicators SHALL retain at least 3:1 contrast against
their adjacent background.

#### Scenario: A user changes theme or hovers a provider destination

- **WHEN** prompt-card calls to action or provider controls render in light or
  dark mode, including hover and focus-visible states
- **THEN** automated token contracts and representative accessibility scans
  retain the required text and focus-indicator contrast

## ADDED Requirements

### Requirement: Mode selection is addressable without leaking paste state

Prompt detail pages SHALL accept at most `?mode=<id>` as a shareable query.
Unknown or absent mode ids MUST fall back to the default mode. Pasted values,
generated prompts, and open-in-chat payloads MUST NOT enter the URL. Copy and
mode switch MUST expose a live status for assistive technology.

#### Scenario: A mode link is shared

- **WHEN** a user selects a non-default mode on `/catalog/<slug>/`
- **THEN** the URL is `/catalog/<slug>/?mode=<id>` and opening it restores that
  mode's paste path without filling placeholders from the URL

#### Scenario: Mode switch is announced

- **WHEN** the user changes mode or copies the current prompt
- **THEN** assistive technology receives a concise live status and the URL
  still contains no pasted values
