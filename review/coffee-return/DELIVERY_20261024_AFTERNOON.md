# 24 October afternoon delivery — disarm stale coffee reset on return

## Change

When a player opens **Try another coffee policy**, leaves the page, and returns through the browser back-forward cache, the old destructive confirmation is now closed. The ordinary replay action is restored. If keyboard focus was inside the confirmation, focus moves to the visible replay button; unrelated focus is not moved.

The saved coffee shift, Personnel progress, opened Office files, storage schema, routes, endings, network behavior and private-preview propagation are unchanged.

## Verification

- New simulated-DOM regression: 49 checks across `feedback`, `test`, `ending`, `return` and `return-ending` phases, including outside-prompt focus plus changed and unreadable storage.
- The regression was observed failing before the lifecycle fix and passing after it.
- A hidden stale confirm cannot clear saved progress after BFCache return.
- Reopening the confirmation and explicitly confirming still clears coffee progress.
- Existing Office file-return checks: 33 PASS.
- Existing CASE-021 playable-file checks: 24 PASS.
- Existing Office diary navigation checks: 6 PASS.
- Inline game script syntax: PASS.

These are source/VM checks, not a real browser, narrow-layout or screen-reader claim.

## Next gate

Synchronize the exact guarded PR head to the existing owner-private QA. In an authenticated narrow browser, play a route, open reset, navigate away and return, confirm that the prompt is disarmed and focus is on the visible replay action, then reopen and explicitly reset. Preserve the owner-private audience. Merge or deploy publicly only after the existing full browser gate passes.
