# Office file clear confirmation — 24 October 2026

## Delivered

- “Clear opened files and current ticket” now opens an inline confirmation before changing browser storage.
- Cancelling or confirming closes the prompt and restores focus to the initiating control. “Keep current file” preserves the current ticket and opened-file history.
- Explicit confirmation clears only `roast_office_drawn_v1` and `roast_office_current_file_v1`; Personnel and coffee progress remain untouched.
- A pageshow/storage reconciliation closes stale confirmation state, including memory-only draws that cannot be persisted. A stale or repeated confirm action cannot clear data.
- Storage failure keeps the visible file open and reports that clearing did not complete.

## Verification

- Office file return: 33 simulated-DOM checks PASS.
- CASE-021 playable-file path: 24 source/VM checks PASS.
- Office diary navigation: 6 source/VM checks PASS.
- JavaScript syntax checks PASS for all three focused suites.

These checks do not replace the authenticated narrow-layout, keyboard-focus, or screen-reader gate.

## Release boundary

PR #1 stays draft. No merge, public deployment, audience change, network behavior, storage schema, card asset, or separate character project change. Next release step: update the owner-private QA from the guarded PR head, then test confirm open → cancel → reopen → confirm → reload on a narrow authenticated browser, including focus and screen-reader labels.
