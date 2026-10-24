# Game afternoon delivery — 22 October 2026

## Player improvement

The existing **Try another coffee policy** reset was trapped inside the receipt panel. A visitor could not restart during feedback, the first test, or a restored unfinished shift without finishing the route first.

The reset now appears after the first policy choice and stays available through every valid restored phase. It returns the visitor to the first decision, clears only the coffee shift, hides itself again on the fresh decision, and preserves Personnel progress plus opened Office files. The existing storage schema, reset handler, privacy boundary and network behavior are unchanged.

## Verification available in this environment

- Exact-parent structural check: RED because the reset was inside the hidden receipt panel.
- Candidate structural check: GREEN; exactly one reset, outside phase-hidden panels, in an initially hidden persistent row.
- Extracted `showReplay` visibility helper: PASS for visible → hidden.
- Candidate inline JavaScript syntax: PASS.
- New focused test file syntax: PASS.

The focused Node regression, existing coffee/Personnel/Office suites, real browser, narrow layout, keyboard focus and authenticated hosted flow were **not run** because the execution environment was unavailable. The new focused suite is committed for the next supported run and covers all valid restored phases, reset isolation, storage-clear failure, preview feedback state and replay after reset.

## Boundary and rollback

Repository `agentlabstudio/chief-roast-office`; branch `work/office-return-20261019`; parent `12a58a55e0cca109ef699302bb05da4a80207c24`. Changed only `case-021.html`, the focused reset test and this delivery note. No merge, deployment, card/asset, Telegram, coin, publication queue or separate character project change.

Rollback: revert the isolated game commit. Next: execute the committed Node suites, then run the authenticated narrow-layout choice → reset → reload and restored-state focus checks before merge or deployment.
