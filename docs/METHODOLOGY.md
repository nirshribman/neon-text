# How this was built

The effect is the easy part. These are the parts worth repeating - including the ones that were
measured and turned out wrong.

---

## 1. Decompose the ask before choosing a technique

"Neon turn-on with a strong flash" is not one effect. Split it into beats - assemble, flicker,
strike, afterglow, steady hum, continuous tube, halo - then ask which the candidate technique is
actually *good* at. Particles won four beats and lost two: they cannot render a continuous saturated
tube, and canvas letters aren't text. That produced three honest routes:

- **CSS/SVG only** - crispest tube, cheapest, but the letters only illuminate, never *arrive*.
- **Pure canvas** - best arrival and flash, but never crisp and never real text.
- **Hybrid** ← chosen. Each layer does what the other can't.

The decomposition is what makes the choice defensible. "Use particles" is a guess; "particles win the
flash because trail-fade *is* an afterglow decay, and lose the tube because dots can't fill a region"
is an argument.

## 2. Build the capture harness first

Every state is reachable headlessly through the URL hash - `#f=N` runs exactly N frames, then
freezes. Exact frame counts are what make a three-frame flipbook diffable across versions; "run until
it looks settled" cannot be compared to anything.

This is the highest-leverage decision in the whole build. Without it, none of the review below is
possible.

## 3. Reproduce in a browser, always

Every behavioural claim was checked live. That caught, in order:

| Bug | How it presented |
|---|---|
| Particles drifted off-stage while unlit | noise × damping gave 20px/frame terminal drift |
| Particles arrived *after* the flash | read as a bug; light and arrival must be one event |
| Long strings overflowed | fixed-px letter-spacing makes width non-linear in size |
| Reduced-motion still animated | skipped the flash, but the dots still flew in |
| Sign rendered the font's name as its text | unanchored `t=` regex matched inside `font=Monoton` |
| Reflection was a duplicate sign | falloff scaled dot *height*, not alpha |
| Dead glass occluded its own particles | solid dark letter with a lit fringe |
| Lowercase descenders sank through the floor | ground line derived from the baseline, not the ink |
| A stain burned into the background | see §4 |
| Two red CORS errors per font load | `:wght@700` 404s on single-weight faces |

**None were visible by reading the code.** Code reading forms the hypothesis; the browser settles it.

I also mis-verified once: navigating between two URLs that differ only in the hash does **not** reload
the document, so I screenshotted a stale frame and reported "the flash isn't rendering." It was
rendering.

## 4. Prefer a mechanism to a workaround

The background developed a low-resolution stain that no amount of tuning removed. The cause wasn't
aesthetic: fading a canvas by painting `rgba(bg, α)` over it **cannot converge**, because 8-bit
rounding returns a pixel one step above background to itself. Faint trails stick permanently.

Fading by *erasing* (`destination-out`) multiplies alpha toward zero, which does reach it. The same
investigation exposed a second mistake - the canvas was opaque and sitting on top of the wall and
floor planes, so the "room" had been nothing but accumulated trail all along.

## 5. Measure; don't reason about it

Two cases where the intuitive answer was wrong by a wide margin:

- **Density → brightness.** "Brightness ∝ dot count" suggests a normalisation exponent near 0.75.
  Sampling mean canvas luminance at 2k/4.6k/12k/24k dots solves to **≈0.42** - overlapping additive
  dots clip toward white and accumulate strongly sub-linearly. The first attempt over-compensated and
  made the dense version 30% *darker*.
- **Performance.** The suspected bottleneck was `globalAlpha` state changes. Eliminating them
  measured 30.2ms vs 27.7ms - **no gain**, so it was reverted. The real cost is `fillRect` count.

**Revert optimisations that don't measure.** Unearned complexity is a liability.

⚠️ **And assert the thing under test still runs before believing a benchmark.** A refactor left an
assignment to a now-`const`, so the draw function threw on every call - and the resulting "2×
improvement" was just the render loop being dead while rAF kept ticking at vsync. Check the frame
counter advances and the canvas has ink, *then* time it.

## 6. Review it as a stranger

Reviewed as an external design juror seeing only screenshots - no knowledge of the engine - scored on
practical use, visuality and flexibility, then fixed and re-reviewed.

| Round | Score | What the score was actually about |
|---|---|---|
| 1 | 63 | sign floating in a void; fixed box; dead to the cursor |
| 2 | 85 | reflection read as a duplicate; a hard rule across the scene |
| 3 | 92 | only one shape; panel always present |

**The engine was finished at 63.** Every point after that came from the room and the framing. Expect
that ratio: effect done, design not started.

Why it works: separating the reviewer's eye from the builder's knowledge. The builder knows why the
reflection is dim; the reviewer only sees that it looks like a second sign.

## 7. State the constraints up front, and surface them in the UI

Flash limits, reduced-motion, accessible naming and the performance ceiling were written down before
they were implemented, and the ceiling is shown **in the interface** (a ⚠ on the dot-count readout)
rather than left to be discovered as jank. A limit the user can see is a design decision; a limit they
trip over is a defect.

## 8. Say what you didn't do

No image or video export - rasterising a composited DOM+canvas scene needs a library, which would cost
the self-contained property. That was the one review criticism deliberately left unfixed rather than
fixed badly, and it's recorded as a known limit rather than quietly dropped.
