# Coffee reset confirmation — 23 October 2026

## Gameplay change

The reset introduced for every unfinished and restored coffee shift cleared the whole coffee route on one activation. On a narrow touch screen, a mistaken tap could discard up to three decisions and their receipts.

**Try another coffee policy** now opens an inline confirmation instead. Opening or cancelling it does not change the current receipt, route, save, feedback URL or other Office state. **Keep current shift** closes the confirmation and returns focus to the reset control. **Clear coffee shift and start again** runs the existing coffee-only reset, restores the first decision and focuses its heading. Stale or double confirmation actions are ignored.

Personnel progress, opened Office files, storage schema, outcomes, media, navigation and network behavior are unchanged. The separate character project is untouched.

## Verification

- `review/coffee-return/tests/reset-anytime.cjs`: covers initial confirmation, cancel/focus, save preservation before confirmation, all valid restored phases, coffee-only clearing and blocked storage.
- Existing Coffee return/revisit, Personnel return, Office playable-file/file-return and diary-navigation suites remain release regressions.
- Real browser, narrow-layout and screen-reader QA remain open; no browser pass is claimed.

## Delivery boundary

Repository `agentlabstudio/chief-roast-office`, PR #1, verified parent `79570f30b98cb094043609ce089c01a0b7b975e7`. This delivery changes only `case-021.html`, focused coffee tests and this log. Use an expected-head guarded fast-forward and reread the PR head. Roll back only this delivery commit to preserve the morning Office change.

Next: synchronize the exact guarded candidate to the existing owner-private QA, then perform authenticated narrow choice → reset prompt → cancel/confirm → reload, focus and Office/Personnel return checks before public merge/deployment.
