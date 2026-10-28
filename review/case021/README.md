# CASE021 source review candidate

This branch is not a release. Desktop/narrow browser rendering, image-load, focus, clipboard and PNG checks remain required. The original CASE021 image is preserved privately and is intentionally absent from this source-only branch. Do not publish this branch as a preview or merge it until the approved private browser QA passes.

The five text changes connect the six-outcome coffee episode, clarify existing personnel consequences, and add optional neutral feedback context. No scoring or saved-state version changed.

## Reproducing the offline checks

The regression scripts expect sibling `base/` and `candidate/` folders under this review directory. Materialize base commit `f806ffe802cb971e338e2bd4419087c68a63d31c` into `base/` and this candidate source tree into `candidate/`, then run each `tests/*.cjs` with Node. These folders are local fixtures, not tracked copies. The saved result JSON reports simulated DOM/rules checks only. No script opens a browser or sends network requests.

Before release, include the original image only after its separately authorized QA, verify all assets, reread main and use an expected-SHA update.
