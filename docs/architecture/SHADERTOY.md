# Shadertoy compatibility

Shadertoy compatibility is a **bounded compatibility product**: paste a
Shadertoy project into a folder and it runs, within a documented scope,
identically in dev, embeds, and export. Every supported construct has a
defined translation into native concepts (the table in
[SHADERTOY_INTEGRATION.md](SHADERTOY_INTEGRATION.md)); whether that
vocabulary is an explicit opt-in mode or ambient in native projects is
an open decision (O014). Everything in this document — the support
matrix, pinned semantics, and conformance suite — applies under either
model, the layer never shapes native semantics, and its corpus is the
permanent regression suite for the executor.

The operating rule: **every feature is supported, adapted (documented
difference), or unsupported (loud error). There is no fourth state where
something silently renders wrong.**

## Support matrix

### Supported

| Feature | Notes |
|---|---|
| `mainImage(out vec4, in vec2)` | Image and buffer passes |
| Common tab | Prepended to all passes |
| BufferA–BufferD | Sequential execution, self-read = previous frame |
| `iResolution, iTime, iTimeDelta, iFrame, iFrameRate` | |
| `iMouse` | Shadertoy's click/drag sign conventions, exactly |
| `iDate, iSampleRate` | |
| `iChannel0–3` per pass | Textures, buffers, keyboard, media |
| `iChannelResolution[4], iChannelTime[4]` | |
| Texture channels | With Shadertoy's per-channel filter / wrap / vflip options |
| Video and webcam channels | Via existing MediaManager |
| Keyboard texture | 256×3 layout: down / pressed / toggled |
| Cubemap channels | Genuine cubemaps; equirect adaptation documented separately (D009) |

### Pinned semantics (the fiddly part, frozen during Stage 1)

These are the details that make or break "it looks the same as on the
website," pinned as executable conformance tests:

- Buffers are **RGBA float32**, sized to the canvas, resized with it
  (contents preserved per Shadertoy behavior).
- A buffer reading itself sees its **previous frame's** committed state;
  first frame reads zeros.
- Unbound channels sample **opaque black**.
- Buffer execution order A→B→C→D→Image; each buffer sees **this frame's**
  output of buffers earlier in the order and **last frame's** output of
  itself and later buffers.
- Mipmap filter requests on buffer channels: generate mipmaps as Shadertoy
  does.
- `iTime` pauses/scrubs with the transport; `iFrame` counts rendered
  frames.
- Texture vflip, sRGB decoding, and premultiplication behavior pinned by
  golden test per channel type.

### Unsupported (loud error, deferred)

| Feature | Status |
|---|---|
| Sound shaders (`mainSound`) | Deferred (F001); error names it |
| `mainVR` | Deferred (F002) |
| `mainCubemap` (Cubemap A buffer) | Deferred (F002); cubemap *channels* are supported |
| Multipass audio/mic channels | Deferred with audio (D008) |

An unsupported feature aborts load with a message naming the feature and
this document. No partial render.

## Conformance suite

- A corpus of **copied real Shadertoy projects** (stored as fixtures with
  attribution) spanning the matrix: single-pass, multi-buffer feedback,
  keyboard, video, cubemap, mouse-interaction shaders.
- **Golden-image tests**: headless Chrome (playwright), fixed frame
  numbers (e.g. frames 0, 1, 10, 120 — frame 1 catches
  first-frame-zeros bugs), per-channel tolerance to absorb GPU float
  variance, run in CI.
- **Cross-path identity**: the same fixture rendered via dev server,
  built embed, and offline export must hash-match itself (same executor —
  this is the one-executor principle made testable).
- The suite runs against the **new executor from the day it exists**; the
  old engine's rendering of the corpus provides the initial goldens.

## Interop with the native system

- A Shadertoy project compiles to a normal RuntimePlan; export, embeds,
  screenshot/recording panels, and the transport all work unmodified.
- How much Shadertoy vocabulary native projects may use is O014
  ([SHADERTOY_INTEGRATION.md](SHADERTOY_INTEGRATION.md)). Under every
  candidate model, native documentation uses native vocabulary only;
  Shadertoy names live in this compat reference.
- A pure-compat marker (W104) scopes the fidelity promise; its exact
  role follows O014.
- Interpretation defaults to Standard (D021); pre-0.4 projects load via
  the compat path with migration diagnostics (D012).
- Shadertoy semantics never leak the other way: native snapshot/commit
  rules are defined in EXECUTION_MODEL.md without reference to Shadertoy
  buffer timing.

## Non-goals

Bit-exact reproduction of shadertoy.com is not promised — ANGLE versions,
driver float behavior, and site-side changes make that unwinnable. The
promise is: documented scope, pinned semantics, conformance-tested
rendering, and honest errors at the boundary.
