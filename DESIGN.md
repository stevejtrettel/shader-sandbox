# shader-sandbox System Design

> The next-generation Standard/Advanced expansion is being designed in
> [`docs/architecture/`](docs/architecture/README.md). This document remains
> the historical reference for the completed 0.3.0 publishing redesign.

*Drafted 2026-07-15, after the Stage 0–4 cleanup. This is the reference for
the 0.3.0 redesign. Everything here was negotiable until it shipped.*

> **Status: IMPLEMENTED** (same day) — all nine steps landed; README
> rewritten to match. Remaining follow-ups live in "Deliberately out of
> scope" below.

## The four author jobs

Everything the package does serves one of these:

| # | Job | Tool |
|---|-----|------|
| 1 | Export HD images | Screenshot panel (dev toolbar) |
| 2 | Export HD videos | Recording panel (dev toolbar) |
| 3 | Shelf-stable folder: drag-drop page OR site embed | `shader build` |
| 4 | Blog embeds that just mount the shader | Elements: `<shader-canvas>`, `<shader-editor>`, `<shader-sandbox>` |

Anything that doesn't serve one of these jobs is a candidate for deletion.

## Principle 1: author tools vs. viewer chrome

Authoring happens in `shader dev`. Publishing produces things viewers see.
These have different UI needs and are controlled separately:

- **The dev server always shows the author toolbar** — screenshot, record,
  export-HTML — regardless of any config. Authors never edit config to reach
  their own tools.
- **`controls` / `stats` / `playback` / `uniformsUI` govern viewer chrome
  only** — what appears in builds and embeds. Their defaults stay
  viewer-appropriate (chrome off, uniforms panel auto when UI uniforms
  exist).

One consequence: the capture/export code paths are identical in dev and in
published output; only the *buttons* differ.

## Principle 2: one source resolver

A single pipeline answers "what is `src`?" everywhere:

| Source | Detected by | Loaded via |
|--------|-------------|-----------|
| Inline GLSL | element text content, no `src` | `loadFromSource` |
| Bare shader file | `src` ends in `.glsl`/`.frag` | fetch loader |
| Project folder | `src` ends in `/` (or fetch of `<src>/image.glsl` succeeds) | fetch loader (config + passes + script + textures) |
| Built module | `src` ends in `.js`/`.mjs` | dynamic `import()`, must export `mount(el, opts) → { destroy() }` |

All elements accept all four. The mount contract is honored for *any*
conforming module (this quietly covers non-shader demos too); the docs only
advertise shader-sandbox builds.

## Jobs 1–2: capture (images & video)

Already in good shape after Stages 3–4 (correct codec levels, backpressure,
deterministic clock via Transport, OfflineRenderer). Remaining work:

- Wire the always-on dev toolbar (Principle 1).
- Optional, small: a **supersample** toggle in the screenshot panel (render
  at 2×, downscale) for print-quality stills.
- Future (parked): interaction recording — capture the live mouse/touch
  trace, replay it through OfflineRenderer.

## Job 3: the shelf-stable folder

`shader build <name>` is THE answer. Output:

```
dist/<name>/
├── main.js       ES module, fully bundled, zero external deps, exports mount()
├── index.html    standalone page (thin wrapper: #app div + main.js auto-mount)
└── README.txt    the two recipes below, so the folder explains itself
```

**Door A — standalone page:** copy the folder to any static host; done.

**Door B — embed:** reference `main.js` from any page:
`<shader-canvas src="/assets/<name>/main.js">` (or `import { mount }`).

Rules:
- The folder contains NO once-per-site helpers (no element script). Per-shader
  folder, per-site helper — a site with ten shaders has one runtime script.
- The build command ends by printing the Door B snippet (correct paths, no
  personal-site conventions).
- The **export-HTML button** remains as the *single-file souvenir*: one
  self-contained .html, uniforms baked, media stubbed. It is not the
  deployment path and the docs say so.

## Job 4: the elements

One script registers all three elements:

```html
<script type="module" src="/js/shader-sandbox.js"></script>
<!-- or: https://esm.sh/shader-sandbox/runtime/standalone -->
```

### `<shader-canvas>` — the picture

Chromeless. Behaves like `<img>`: fills its container, no decoration, no
playback UI. The composable primitive.

| Attribute | Meaning |
|-----------|---------|
| `src` | any of the four source kinds |
| `id` | targeting handle for `<shader-editor for>` |
| `static` | render one frame, stay frozen |
| `start-paused`, `pixel-ratio`, `sticky-mouse` | as today |
| `lazy` | default true: mount on scroll-in, pause off-screen |

Notes:
- Built-module sources are mounted with chromeless overrides
  (`controls:false`, no pane decoration).
- Keeps all current runtime-element hardening (destroy-during-load guard,
  re-parent survival, last-IntersectionObserver-entry).

### `<shader-editor>` — the code

EditorPanel bound to a remote canvas. `theme="auto"` host-mode by default
(inherits site fonts/colors, `prefers-color-scheme` syntax).

**The editing loop (fully live):** type freely; recompile with
Ctrl/Cmd+Enter or the Recompile button. The bound canvas swaps the shader
in place — time and buffer state preserved, nothing reloads. Compile
errors appear in the editor's error strip (user-relative line numbers)
while the canvas keeps running the last good shader; a broken edit never
kills the picture. Recompiles are per-pass; editing `common` recompiles
all passes with rollback on failure. Deliberately NOT
compile-on-keystroke (half-typed GLSL is invalid almost continuously) —
an `autorun` attribute (debounced) is possible future work if explicit
triggering proves annoying.

| Attribute | Meaning |
|-----------|---------|
| `for` | id of the target `<shader-canvas>`. Omitted: auto-binds iff the page has exactly one canvas |
| `pass` | narrow to a single tabless code block (`image`, `bufferA`, `common`) |
| `theme` | `auto` (default) / `light` / `dark` / `system` |

Binding semantics:
- Canvas registry (id → element) with events for late binding; bindings
  survive canvas re-parent/remount.
- Missing/typo'd `for`: visible placeholder in the editor + console warning.
  Never silent.
- **Editor forces load, not play:** a visible editor makes its bound canvas
  fetch + compile immediately (so sources render), but the canvas still
  waits for visibility before animating. Keeps WebGL-context budgets intact
  on long pages.
- Future, not v1: `readonly` (display + copy button, no recompile).

### `<shader-sandbox>` — the appliance

Unchanged one-tag preset (`layout` = `default` / `fullscreen` / `split` /
`tabbed`). Existing embeds keep working forever. Internally becomes
"canvas + optional editor in a preset arrangement" over the same registry.

### Removed: `<live-app>`

Its shader duty is absorbed by `src="*.js"`; its generic duty is site
infrastructure, not shader-package scope. The current generated
`templates/live-app.js` is self-contained with zero imports — existing site
copies keep working forever without maintenance. Migration note ships in the
release notes.

## Public surface (0.3.0)

**JS API (`shader-sandbox`):** `mount`, `loadDemo`, `MountOptions`,
`MountPresentationOptions`, `MountHandle`, project types, type guards.
Everything else (App, ShaderView, layouts, applyTheme, MultiViewControls)
becomes internal.

**Elements (`shader-sandbox/runtime` + standalone):** `shader-canvas`,
`shader-editor`, `shader-sandbox`.

**CLI:** unchanged commands; build-output polish per Job 3.

**Removed:** `live-app` element + template, `templates/live-app.js`.

Breaking changes → version 0.3.0, with migration notes for: `live-app`,
trimmed JS exports, `readPixels` Float32Array (from Stage 2), struct-array
raw setter semantics (from Stage 2).

## Implementation order

1. **Author/viewer chrome split** — dev toolbar always on; config governs
   viewer chrome only. (S)
2. **Build output polish** — README.txt, embed snippet, message cleanup. (S)
3. **API trim** — index.ts/node.ts surface, parity test updates. (S)
4. **Source resolver** — unify inline/.glsl/folder/.js behind one function;
   `.js` module support. (M)
5. **Canvas registry + `<shader-canvas>`** — extract from today's
   ShaderSandbox element. (M)
6. **`<shader-editor>`** — EditorPanel + registry binding + load-not-play. (M)
7. **`<shader-sandbox>` reimplemented** on the registry internally;
   `live-app` removed. (S/M)
8. **Screenshot supersample toggle.** (S)
9. **README rewrite** (the old Stage 6, now documenting this system, once,
   coherently). (M)

Each step lands green (tsc + suite + builds); demo checkpoints after 1, 6,
and 7.

## Deliberately out of scope

- Interaction recording (parked; design sketch above)
- Multi-view export (clean error stays)
- Panel CSS merge (rides with the next styling pass)
- `readonly` editor attribute
