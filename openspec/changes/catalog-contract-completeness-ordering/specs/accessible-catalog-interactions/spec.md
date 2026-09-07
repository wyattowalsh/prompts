<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## MODIFIED Requirements

### Requirement: Mode selection is addressable without leaking paste state

Prompt detail pages SHALL accept at most `?mode=<id>` as a shareable query.
Unknown or absent mode IDs MUST fall back to the default mode. Pasted values,
generated prompts, and open-in-chat payloads MUST NOT enter the URL. Copy and
user-initiated mode switches MUST expose status through the existing single
atomic polite live region; interactive surfaces MUST NOT create a second hidden
or visible live region for mode state.

When a no-paste mode is selected on prompt detail or in catalog preview, the
surface MUST render this persistent section, which MUST NOT itself be a live
region:

```text
Heading: No copyable template for this mode
Body: No copyable template is available for {mode.label}. {template_omission_reason}
```

Mode selector, Copy link, Print, Evaluation, Safety, Sources, and Caveats MUST
remain available where that surface normally provides them. Copy link MUST remain
functional and MUST copy only the site's canonical prompt-page URL for the
selected mode, whose path is `/catalog/<slug>/` and whose only possible query is
the normalized `?mode=<id>` share query permitted above. It MUST NOT copy a prompt
body, filled prompt, or provider payload. Copy prompt, prompt copy block, Open-in-Chat controls, Fill form,
Use examples, Clear, Jump to filled prompt, fill progress, Filled badge, prompt
output, and current Markdown prompt export MUST be absent from the DOM rather than
rendered disabled. Preview MUST show the same persistent explanation and MUST NOT
expose placeholders as an actionable paste path.

A user-initiated switch into a no-paste mode MUST announce exactly:

```text
Mode switched to {label}. No copyable template is available for this mode.
```

A user-initiated switch from no-paste into a paste-path mode MUST announce
exactly:

```text
Mode switched to {label}. Copy, fill, and open-in-chat actions are available.
```

A direct initial load into a no-paste mode MUST render the persistent section but
leave the live region empty. No no-paste interaction other than user activation of
Copy link may write the clipboard. No no-paste interaction may create a dead
disabled focus stop, send an empty prompt to a handler, write a prompt body, filled
prompt, or provider payload to the clipboard, or open a provider.

#### Scenario: A mode link is shared

- **WHEN** a user selects a non-default mode on `/catalog/<slug>/`
- **THEN** the URL is `/catalog/<slug>/?mode=<id>` and opening it restores that mode without filling placeholders from the URL

#### Scenario: Mode switch is announced

- **WHEN** the user changes mode or copies the current paste-path prompt
- **THEN** assistive technology receives one concise status through the existing atomic polite live region and the URL still contains no pasted values

#### Scenario: A no-paste mode loads directly

- **WHEN** a shared or default route initially selects a mode with `template_omission_reason`
- **THEN** prompt detail renders the exact persistent no-paste heading and body while the live region remains empty
- **AND** paste-only controls and handlers are absent from the DOM while functional Copy link and Print actions remain available

#### Scenario: Copy link is used for a no-paste mode

- **WHEN** a user activates Copy link while a no-paste mode is selected
- **THEN** the clipboard receives only that mode's canonical prompt-page URL with at most the normalized `?mode=<id>` share query
- **AND** no prompt body, filled prompt, or provider payload is written and no provider is opened

#### Scenario: A user switches into a no-paste mode

- **WHEN** the user changes from a paste-path mode to a no-paste mode
- **THEN** the persistent section replaces paste-only controls and the existing live region announces `Mode switched to {label}. No copyable template is available for this mode.` exactly once
- **AND** the transition writes no prompt body, filled prompt, or provider payload to the clipboard and causes no provider-open side effect

#### Scenario: A user switches back to a paste-path mode

- **WHEN** the user changes from a no-paste mode to a valid paste-path mode
- **THEN** paste, fill, and open-in-chat controls return and the existing live region announces `Mode switched to {label}. Copy, fill, and open-in-chat actions are available.` exactly once

#### Scenario: Catalog preview displays a no-paste mode

- **WHEN** catalog preview selects a mode with `template_omission_reason`
- **THEN** it renders the same persistent no-paste heading and body without a prompt copy block, paste action, or actionable placeholder display

#### Scenario: No-paste controls remain keyboard-safe

- **WHEN** a keyboard user traverses prompt detail or preview while a no-paste mode is selected
- **THEN** removed paste-only actions create no disabled focus stops and the remaining controls follow the surface's ordinary focus order
