# CASE-021 optional return — source candidate

Base: `work/case021-coffee-20261015` at `402a9cbddfb62bb8f4fb848f6b4b211672f0a209`. Public main remains `f806ffe802cb971e338e2bd4419087c68a63d31c`.

This extends the existing coffee scene with one optional next-shift decision. All six original receipts are preserved. Each one produces its own next situation and two choices, for twelve new receipts. The return receipt shows the earlier result beside the later consequence. No additional game, token benefit, visitor claim, storage or submission is introduced. Reload still resets coffee only; personnel saves are not accessed.

Changes: `case-021.html` and `assets/office-signals.js`. Feedback uses the distinct `coffee-20261015-return` build label with a fixed allowlist. The previous `coffee-20261015` labels and six routes remain accepted. Unknown route strings are ignored and nothing is sent merely by clicking a game choice.

The independent Sol review confirmed byte-identical original endings and found two minor issues, both fixed: an unjustified assumption about the intern’s machine knowledge and missing screen-reader context on the return transition. The pair route now uses an available knowledgeable colleague. The return heading describes the prior result with `aria-describedby`, removed on replay.

Run `node review/coffee-return/tests/coffee-return.cjs` from the candidate checkout, or run `node work/game-next/tests/coffee-return.cjs` from the original workspace. The test includes its original source fixture. Results: six original receipts unchanged; twelve return paths; 52 rejected invalid actions/contexts; 24 allowed feedback contexts; twelve replay resets. Actual scripts ran in a simulated DOM. This is not browser, layout or physical-device QA.

Publication still requires the previously required supported real browser check, including portrait image load, mobile/desktop layout, focus, replay and optional feedback navigation. Existing founder permission for a checked CASE-021 release remains valid. Do not bypass the rejected file-URL route or change main before that gate. The exact original CASE-021 PNG remains private and must be added unchanged only for the authorised release.

No other candidate files, scores, choice effects, personnel saves, endpoints, images or current public release changed.
