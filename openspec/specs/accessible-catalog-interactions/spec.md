<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

# accessible-catalog-interactions Specification

## Purpose
Defines accessible, privacy-preserving, addressable, and efficiently loaded interactions for catalog preview, exploration, command, and sharing experiences.
## Requirements
### Requirement: Catalog preview behaves as an accessible modal dialog

The catalog preview SHALL be absent from the initial application module graph until first requested. Once open, it MUST expose dialog semantics, move focus inside, contain keyboard focus, close with Escape, make background content non-interactive, and restore focus to the invoking control.

#### Scenario: A keyboard user opens and closes preview

- **WHEN** the user invokes preview, presses Tab through its controls, and then presses Escape
- **THEN** focus never escapes behind the dialog while open and returns to the invoking control after close

#### Scenario: The home route loads without preview

- **WHEN** the application initially loads and preview has not been requested
- **THEN** the preview implementation is not present in the initial route chunk graph

### Requirement: Explorer state is addressable and keyboard-operable

The explorer SHALL encode its normalized search query and scope in the URL. It MUST restore state from direct links and browser history, omit default or empty parameters, expose a named selectable collection, and support Arrow, Home, End, Enter, and Escape keyboard behavior without trapping focus.

#### Scenario: An explorer link is shared

- **WHEN** a user selects a non-default scope and enters a query
- **THEN** the URL represents both values and opening that URL restores the same filtered view

#### Scenario: An explorer query exceeds the normalization limit

- **WHEN** a user enters decomposed Unicode, repeated whitespace, or more than 160 code points
- **THEN** filtering and the shareable `q` parameter use the same NFC-normalized, whitespace-collapsed, capped value while the focused input preserves a lossless editing buffer
- **AND** blurring or restoring the control commits that normalized value into the visible input

#### Scenario: A keyboard user browses results

- **WHEN** focus is on the result collection and the user presses supported navigation keys
- **THEN** the active option changes predictably and Enter opens the active destination

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

### Requirement: Runtime browsing does not disclose catalog destinations to favicon services

The application MUST NOT send catalog destination hostnames or URLs to a third-party favicon, screenshot, image-proxy, or tracking endpoint. Provider and source marks SHALL use bundled assets or deterministic local rendering. Compact provider cues MUST record repository-local provenance and MUST NOT claim official artwork unless that provenance has been explicitly audited.

#### Scenario: Explorer results render

- **WHEN** the explorer displays external resources
- **THEN** no runtime request to a third-party favicon or image-proxy service contains those resources' hostnames or URLs

#### Scenario: A provider cue has no audited official artwork

- **WHEN** an Open-in-chat destination renders its compact identity mark
- **THEN** it uses a repository-authored local symbol or neutral monogram, records that it is not official artwork, and performs no runtime network fetch

### Requirement: Deferred command functionality remains truly deferred

Command-palette implementation and command-specific dependencies SHALL load only after explicit command invocation. Idle callbacks or shared manual chunks MUST NOT cause them to be preloaded by the initial document.

#### Scenario: The home document loads without command use

- **WHEN** a user loads the application and performs no palette action
- **THEN** the initial HTML and initial module graph do not fetch the command-palette chunk or its command-only dependency

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
