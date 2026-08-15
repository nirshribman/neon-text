# Spec

## Architecture

Three layers, each doing the job the others can't:

| Layer | Carries | Why it exists |
|---|---|---|
| **DOM text ×2** - dead glass + lit gas, one `<span>` per character | the tube | Dots cannot render a continuous saturated tube. CSS `text-shadow` can, and the text stays real. Light level = the lit copy's opacity. |
| **Canvas particles** behind | gas, assembly, flash, reflection | The letters *arrive* instead of merely switching on. CSS can't do that. |
| **Scene** - wall, floor, reflection, light pool, vignette, grain | the room | Neon is convincing because of what it does to its surroundings. |

Both DOM layers and the canvas draw each glyph at the **same computed x**, so the two rendering
engines cannot drift apart. Per-character positioning costs kerning (negligible in display faces) and
buys exact agreement.

**Vertical layout is driven by measured ink, not font metrics.** After sampling, the true min/max y
of the drawn pixels gives (a) the ground line, placed just below the *lowest ink* so lowercase
descenders clear the floor rather than sinking through it, and (b) optical centring of the ink rather
than the em box, so all-caps doesn't sit low and lowercase doesn't sit high.

**The canvas is transparent and fades by erasing** (`destination-out`), not by painting a translucent
background over itself. Painting `rgba(bg, a)` can never reach the background because of 8-bit
rounding - a pixel one step above background computes back to itself and sticks forever, which reads
as a low-resolution stain burned into the scene. It also has to be transparent, or it hides the wall
and floor planes underneath it entirely.

## Options

`text` (`|` = new line) · `mode` · `font` · `glow` · `core` · `wall` · `hue` · `coreHeat` · `size` ·
`track` · `tube` · `dots` · `dotSize` · `gas` · `hug` · `settle` · `trail` · `room` · `reflect` ·
`push` · `flash` · `scatter` · `pulses` · `stagger` · `gap`

`set()` rebuilds only what a change requires: geometry keys trigger a rebuild, scheduling keys
re-schedule, room keys restyle. Getting that mapping wrong is silent - the value stores and nothing
on screen changes.

### Two options that change what it is

- **`tube` (0-1)** - a continuum from *neon tube with gas around it* (1) to a letterform made of
  nothing but particles (0).
- **`hug` (0-1)** - where the unlit gas lives: a room-filling haze (0), or glow clinging to the
  letterforms only (1). Hugging must survive the *drift*, not just the initial scatter.

## Modes

Every mode is the same machinery with a different per-character strike-frame schedule.

| Mode | `t0` schedule |
|---|---|
| `strike` | all characters share `t0` - flicker, then one wide flash |
| `cascade` | `t0 = start + i·gap` - each letter gets its **own** flash |
| `random` | same, deterministically shuffled |
| `wave` | all lit early, then a travelling `sin(F - i·φ)⁶` pulse |
| `assemble` | shape first, light second: particles build, then ignite |
| `instant` | `t0 = 0` |

## Constraints

- **WCAG 2.3.1** - max 3 flashes/second; the general-flash threshold applies above ~25% of the
  viewport. The wide flash fires **once**, only in `strike`. Per-letter modes get a tight bloom
  radius (~17% vs 55%) at about a third the opacity. Don't raise `pulses` above 3.
- **`prefers-reduced-motion`** - no assembly, flicker or flash; dots start on target so the first
  painted frame is the finished legible sign.
- **Accessibility** - `role="img"` + `aria-label` with the full string. Per-character absolute spans
  cost natural text selection; the accessible name is still correct.
- **Performance** - dominated by `fillRect` count. Median rAF frame ms (display capped at 11.2):
  4.6k → 11.1 · 10k → 11.1 (still vsync-locked) · 16k → 16.5 · 20k → 20.1. Full rate to ~10k, 60fps
  to ~16k. Measure over real rAF frames; a synchronous draw loop omits paint and misreports by ~2×.

## Verification hooks

The playground reads URL-hash overrides so any state can be captured headlessly:

```
#t=TEXT  #mode=cascade  #font=Monoton  #c=ff2d95  #k=ffffff
#s=hug:1,dots:9000      #f=N   (run N frames, freeze, hide panel)
```

Keys are delimiter-anchored - an unanchored `t=` also matches inside `font=Monoton`.
⚠️ Changing **only** the hash does not reload the document; bump a query param too.

## Trail-residue verification

The no-accumulation change is the kind that can pass in one configuration and fail in another, so it
was measured across the matrix rather than spot-checked. Per combination: settle 200 frames, sweep the
cursor across the sign for 70 frames, settle 300 more, then measure total canvas alpha and count stray
pixels in a band above the letters.

| Coverage | Result |
|---|---|
| All 6 looks (each in its own mode, `trail` 16-34) | **0** stray pixels; ±1-2.7% alpha jitter |
| All 6 modes on one look | **0** stray pixels; ±1-2.8% |
| Long run at rest, 720 frames sampled every 30 | oscillates 1972↔2503, **0.48% drift** |

The oscillation is the breathe cycle (~140 frames). Sampling at 300-frame intervals aliases against it
and produces a fake 13.6% "growth" - sample finer than the cycle, or you'll chase a trend that isn't
there.

## Known limits

- No image/video export - capture is a screen recording. Rasterising a composited DOM+canvas scene
  needs a library, which would cost the self-contained property.
- Google Fonts is the only network dependency. System faces work offline.
- Some signage faces are uppercase-only; `Neon.loadFont()` reports `caps: true`.
- Past ~16k dots, per-dot `fillRect` is the wrong primitive - use `ImageData`.
