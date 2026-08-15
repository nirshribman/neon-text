# Changelog

Frozen single-file builds live in `versions/` and never change - a link to one
keeps working regardless of what happens to `src/`.

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
