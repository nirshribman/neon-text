# Changelog

Frozen single-file builds live in `versions/` and never change - a link to one
keeps working regardless of what happens to `src/`.

## v1.1.0 - 2026-08-16

Three new modes, including the first exit, and code export for external pages.

- `trace` - a hot head of light sweeps the measured ink left to right, filling the
  letterforms behind it. No per-letter flash: the sweep is the event, and the front
  overshoots the last letter so the head fades off the end instead of popping.
- `broken` - a tired sign. One or two letters (picked deterministically per text, so
  replays show the same fault) cycle: tired, stutter, dead with failed re-strikes, one
  honest flash, settle. Stutter paced at ~2.4 flashes/sec to stay clear of WCAG 2.3.1.
- `drain` - the first EXIT mode (`Neon.EXIT_MODES`). The sign runs steady, then the
  power cuts: letters die in a left-to-right ripple with a dying stutter, the spring
  lets go with the light, and per-dot buoyancy plus a new `dim` envelope field takes
  the gas itself to nothing. Under reduced motion an exit renders its end state - the
  dead sign - immediately.
- Verified frame-by-frame in headless Chrome (pause + step + screenshot), including a
  `prefers-reduced-motion` run. Awaiting the PM's live-hand check before release.
- **Export code** - a panel modal that generates a copy-paste embed snippet for an
  external page: two pinned jsDelivr includes (tagged to the running `Neon.version`),
  a version comment, and one `Neon.create` call carrying only the diff from defaults.
  The embed div ships a bottom mask feather so the dark room dissolves into the host
  page. Proven by consuming the snippet on a blank third-party page.

### Fixed

- **Combed letterforms in the particle layer.** Which sample sites got a dot was
  chosen by `k * 2654435761 % n` - a LATTICE. There are roughly 5x more sample
  sites than dots, so this picked a structured subset, and because the candidate
  list is row-major that lattice resonated with the row width and printed a comb
  of vertical stripes through any wide, shallow ink region. A `T`'s crossbar was
  the worst case and read as visibly corrupt while its stem looked fine. Site
  selection is now a seeded Fisher-Yates shuffle: no periodicity to resonate,
  still deterministic across replays, one O(n) pass at build.

### External design-review loop: 86 -> 91 -> 94 -> **96, signed** (4 rounds)

An independent Apple-trained design reviewer scored three criteria (motion craft /
interface craft / cohesion+legibility, weighted 45/30/25) against frame-exact
screenshot evidence each round, until the overall cleared 95. Round 4 verdict:
"I would ship this under my own name." Post-sign polish also applied: trace head
0-stop leans toward glow in letter gaps, H no longer strands focus on a hidden
panel, Space is swallowed on focused sliders, top feather eased to 12%.

### Fixed during the review loop (round 1: 86/100)

- **Trace head extinguished between letters.** The hot head existed only as a
  per-letter envelope, so it vanished in every inter-letter trough and died at the
  word gap. It is now a free-floating radial light drawn into the gas at `x = front`,
  with the room bloom riding it continuously; letters ignite as it passes.
- **Floor pool parked at the sign's left edge.** The pool tracked the "loudest"
  letter and the max() tie-broke to the first character whenever all letters hummed
  equally. It now tracks the lit centroid via its own `--px` property, smoothed.
- **Stale font-load callback stomped later state.** A pending Google-font load would
  `build()+replay()` on arrival even after the font had been changed again
  (reproduced live: it silently restarted the animation mid-sequence). Both load
  callbacks now verify the font is still the one that was requested.
- **Duplicate `id="export"`** on the panel button and the modal container leaked the
  modal's 620px container CSS onto the button and corrupted the panel layout.
- **Drain onset read scrambled** - the dying flick could black a letter out before
  its neighbours had dimmed; it is now gated past onset and capped at half depth.
- Modal: Escape hoisted above the input early-returns, honest async copy feedback
  ("✗ press Ctrl+C" on clipboard rejection), dialog semantics + Tab trap + focus
  return, primary treatment on Copy code, autosized snippet box.
- Panel: Looks grid gained a selected state (cleared on any manual change); the
  9-mode grid is 3x3 with no orphan row.

## v1.0.0 - 2026-08-15

First release.

- Hybrid engine: real DOM text for the tube, particle canvas for gas, assembly and flash
- Six animation modes, including `assemble` (particles build the letterform) and per-letter `cascade`
- Six complete looks; any Google font; multi-line via `|`; hue spread across letters
- Scene: wall, foreshortened floor reflection, tracking light pool, vignette, grain
- `tube` dial: neon tube through to a letterform of pure particles
- Cursor stirs the gas; `prefers-reduced-motion` honoured with a still, legible end state
- Flash strength synced to how assembled the sign actually is
- Dot density decoupled from exposure (measured normalisation exponent ≈0.42)

### Fixed during v1.0.0 verification

- **Trail burn-in.** Trails came from fading the previous frame; fading is
  proportional (`alpha *= 1-a`) and 8-bit rounding leaves anything at alpha 1-5
  permanent. Every path a particle was pushed along kept a smear. Frames now
  clear completely and trails are drawn explicitly as motion segments.
- **Opaque canvas hid the scene.** It sat above the wall and floor planes, so
  the "room" was nothing but accumulated trail.
- **Frozen-frame captures were wiped** by the ResizeObserver rebuild triggered
  when hiding the panel.
- **Reflection spans had no default opacity**, so any unreached frame rendered
  the reflection at full strength over an unlit sign.
