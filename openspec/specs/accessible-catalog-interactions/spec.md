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

The catalog home SHALL expose one atomic polite status message for filter-result counts. The complete dynamic result-card container MUST NOT be a live region.

#### Scenario: A user changes the catalog search query

- **WHEN** the visible recipe and pattern counts change
- **THEN** assistive technology receives one concise count summary without re-announcing every matching card

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

### Requirement: Share destinations preserve Unicode within a bounded URL

Share and open-in-chat URLs SHALL preserve arbitrary Unicode prompt text through standards-compliant URL encoding and MUST keep payload data in the destination's intended query component. Each final encoded URL MUST be no longer than 4,096 ASCII characters. When a payload exceeds that budget, truncation MUST retain a whole-grapheme prefix, append a truncation marker when space permits, and never emit an unpaired surrogate.
Supported clients MUST provide standards-compliant `Intl.Segmenter` grapheme segmentation; URL construction MUST fail closed rather than use an incomplete Unicode approximation when it is unavailable.

#### Scenario: A prompt within the URL budget contains non-ASCII text and emoji

- **WHEN** the application constructs a share or chat URL whose encoded form fits the final URL budget
- **THEN** parsing and decoding the destination query yields the original text without corruption or thrown encoding errors

#### Scenario: A filled prompt exceeds the destination URL budget

- **WHEN** percent-encoding the prompt would make the final provider URL longer than 4,096 characters
- **THEN** the emitted URL stays within the limit and its decoded query is a grapheme-safe prefix with an explicit truncation marker

### Requirement: Small interactive text and focus cues remain contrast-safe

Small recipe-card calls to action and provider labels SHALL use text colors with at least 4.5:1 contrast in supported light and dark themes, including hover states. Keyboard focus indicators SHALL retain at least 3:1 contrast against their adjacent background.

#### Scenario: A user changes theme or hovers a provider destination

- **WHEN** recipe-card calls to action or provider controls render in light or dark mode, including hover and focus-visible states
- **THEN** automated token contracts and representative accessibility scans retain the required text and focus-indicator contrast
