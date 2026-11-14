# Handoff: reading list for the 1.0 rebuild

Written 2026-11-14 at the end of a long scoping conversation with the owner.
You are a fresh instance picking this up. Your job is to read everything
below until you understand it properly, and then discuss a build plan with
the owner. Do not write code or restructure anything before that discussion.

## How the owner works

- A professor of mathematics who codes as a hobby, mainly JavaScript and
  GLSL, and is learning TypeScript. Wants to be told when there is a better
  idea than the one on the table, and likes learning along the way.
- This is a personal project. "No vibe coding": every design choice is
  talked through together before it is built.
- They type quickly on a keyboard that drops some letters (often `r` and
  `f`). Read for intent.
- They have plenty of compute budget and are happy for agents to be used
  for thorough exploration.

## The situation in six facts

1. `shader-sandbox` on npm is at **0.2.7** (26 April 2026). Other people
   use it.
2. `main` in this repo is **0.3.0, never published**: an audit, bug fixes
   and a "four author jobs" redesign done on 15 July 2026.
3. A full design for a rebuild was written on 16 July 2026 on a branch
   called `rebuild` and then forgotten. It is now merged into this branch
   as `docs/architecture/`. It has no code.
4. The owner has a second, private repo, `stevejtrettel/webgl-demos`: an
   earlier and more general custom shader system (named buffers, formats,
   iterations, includes, a GLSL library, panels). The July design treats
   it as a corpus of projects to support, not as code to merge.
5. The goal now is a **from-scratch rebuild released as 1.0**, with
   breaking changes allowed, built carefully over days.
6. This conversation re-derived parts of the July design before finding
   it, contradicted it in places, and added several things it lacks. The
   differences are listed below and need resolving with the owner.

## Reading list

Read in this order. Each item says what to take from it.

### A. The current package (this repo, `main` = 0.3.0)

| Read | For |
|---|---|
| `README.md` | What users are told today: config format, uniforms, scripting, elements, CLI |
| `DESIGN.md` | The four author jobs (HD images, HD video, shelf-stable folder, blog embeds) and the author/viewer chrome split. These jobs must survive the rebuild |
| `CODE_AUDIT.md`, `FIX_PLAN.md` | What the July audit found and fixed. History, mostly complete |
| `src/project/types.ts` | Every config and project type. The Shadertoy-shaped model lives here (`PassName` is a fixed five-way union) |
| `src/project/loadProjectCore.ts`, `configHelpers.ts` | Loading, validation, the three config styles (Shadertoy, standard with named buffers, standard with `iChannel`) |
| `src/engine/ShaderEngine.ts`, `shaderSource.ts`, `UniformManager.ts`, `std140.ts`, `glHelpers.ts`, `MediaManager.ts` | The engine to be replaced; what it injects into shaders; UBO arrays |
| `src/app/App.ts`, `ShaderView.ts`, `Transport.ts`, `OfflineRenderer.ts`, `Mp4Encoder.ts`, `exportHTML.ts`, `InputManager.ts` | Frame loop, deterministic clock, capture, the hand-written export player |
| `src/mount.ts`, `src/runtime.ts`, `src/index.ts`, `src/node.ts` | Public JS API and the three custom elements |
| `src/layouts/`, `src/uniforms/`, `src/editor/`, `src/app/*Panel.ts`, `panel-kit.ts` | The UI layer, which the owner has put on the table for redesign |
| `bin/cli.js`, `scripts/`, `templates/` | CLI commands, build output, what `shader create` scaffolds |
| `tests/` | 102 passing unit tests, all pure logic; nothing touches WebGL |
| `demos/` | About 40 projects; the natural golden-image corpus |

### B. The July rebuild design (`docs/architecture/`)

Read all of it. Suggested order:

1. `README.md`: six concepts, capability space, principles, status.
2. `PROJECT_MODEL.md`: what authors write; `shade(Fragment)`, `compute(Cell)`.
3. `EXECUTION_MODEL.md`: versions, snapshot default, schedule IR, clocks.
4. `RUNTIME.md`: contained rewrite, what survives, single GL context, tiers.
5. `SHADERTOY.md`, `SHADERTOY_INTEGRATION.md`: compat scope and the open
   question of how far Shadertoy vocabulary reaches (O014).
6. `DECISIONS.md`: 34 decisions, settled / working / open / deferred.
7. `PAPER_CHECK.md` and `fixtures/`: seven projects hand-compiled to the
   schedule IR, and five draft fixture projects. **The previous instance
   did not read these two.**
8. `ROADMAP.md`: stages 0 to 7. Says "0.4"; the target is now 1.0.

### C. `webgl-demos` (private; attach it yourself)

It is not part of this repo. Attach `stevejtrettel/webgl-demos` read-only
and clone it. Then read:

| Read | For |
|---|---|
| `README.md`, `docs/PROJECT_GUIDE.md`, `docs/COORDINATE_SYSTEM.md`, `docs/PASS_PATTERNS.md`, `docs/INIT_SHADERS.md` | The project model: buffers with format/resolution/pingPong/init, passes keyed by target, `computeIterationsPerFrame`, `mathSpace`, injected `uv`/`pos`/`mousePos`/`pixel`, `u`-prefixed built-ins |
| `docs/SHADER_LIBRARY.md`, `src/shaders/lib/` | A 35-file GLSL library and its `#include` mechanism |
| `docs/PANELS_GUIDE.md`, `docs/LAYOUTS_GUIDE.md`, `src/panels/`, `src/layouts/` | A composable panel UI |
| `docs/3D_RENDERING.md`, `docs/VERTEX_SHADERS*.md` | Volumes, custom geometry and vertex shaders |
| `src/engine/`, `src/project/`, `src/core/`, `src/utils/` | The implementation (about 14,700 lines in total) |
| `examples/`, `demos/`, `new-demos/` | Roughly 80 projects: the requirements corpus |
| Branches `rebuild`, `old`, and ten unmerged `claude/*` branches | Possibly more forgotten work |

### D. Reports from this session

Five exploration agents were started on `webgl-demos` and on branch
history. When their reports exist they are in `docs/handoff/reports/`.
If that folder is missing, they were not saved; re-run the exploration.

1. Engine and project model of `webgl-demos`, from the code.
2. Inventory of every `webgl-demos` project on the capability axes.
3. Correctness, purity and licensing review of its GLSL library.
4. Comparison of the two UI layers.
5. Sweep of all branches in both repos for unmerged work.

### E. Not yet looked at

- Other repos that may hold shader-system work: `shader-demos`,
  `shader-course`, `PathTracerGLSL` (a code search for "shade" and
  "Fragment" matched its compiler docs). Ask the owner which matter.
- `PAPER_CHECK.md` and the fixture folders, as noted above.

## What the owner said in this session

These are the owner's own positions, not proposals.

- **Ours is the default; Shadertoy becomes a mode converted into our
  system.** Shadertoy compatibility must stay possible, since the project
  began as a Shadertoy wrapper.
- **1.0 with breaking changes is fine.** Others use the package, so the
  break should be deliberate and documented.
- **A proper rebuild from scratch**, perfected over a day or a week before
  publishing.
- **The UI layer is in scope.** Anything user-facing or user-controllable
  should be set up cleanly for the future.
- **Audience:** mathematicians who have learned or are learning GLSL and
  want to write good shaders themselves. Not prompt-only users.
- **The shaders are the artifact.** They should be simple, hand-readable
  files, exactly what a person would write. They are the mathematics and
  the art.
- **Workflow today is mixed:** written by hand, increasingly with an LLM
  in the repo modifying or supplying pieces.
- **Wants to design for the LLM era:** how people will use the package to
  write and run code now.
- **Wants a library of tested, proven code** for people and AI to read and
  copy. Long-term.
- **Easy out of the box, customizable for those who want it** (JavaScript,
  multiple shaders) without a cliff.
- **Unsure about hand-declaring uniforms**, because they may be needed in
  every pass and in the config. Suggested instead showing users which
  uniforms exist and where they are used.
- **Fine with built-in functions and prebuilt structs** such as
  `shade(Fragment)`, but wants that design thought through carefully.
- **`webgl-demos` is their own custom codebase** and should be explored
  thoroughly before redesigning.

## Proposals made by the previous instance (not ratified)

Treat these as input to weigh against the July design.

- **Agent tooling:** `shader check` (headless compile, `file:line` errors,
  exit code), `shader snapshot` (render a frame to PNG), a single config
  schema generating types, validation and editor completion, and an agent
  reference file dropped into new projects. Cost: headless WebGL2 needs a
  real browser as an optional dependency.
- **Library mechanics:** `#include`; pure functions as the foundation;
  a `shader test` runner that evaluates GLSL on the GPU against reference
  values; a prefix convention and include guards; a `flatten` command that
  produces one Shadertoy-pasteable file; the library as a separate package
  after 1.0 ships the mechanisms.
- **Kits:** opt-in bundles of functions, default uniforms and controls
  (shading, cameras). Open question whether including one should add
  sliders automatically.
- **Uniform visibility (if injection stays):** a read-only "provided by
  the sandbox" block in the editor; a per-pass usage report from
  `getActiveUniform`; "did you mean" errors; a command that prints the
  full compiled source. Open question: do users run GLSL linters that
  would flag injected names?
- **UI:** composable elements with presets as arrangements of them, so
  presentation is customized in HTML.
- **Compatibility policy:** old configs keep loading where translation is
  mechanical; nothing changes meaning silently; a `shader migrate`
  command; docs recommend a pinned runtime URL.
- **Five principles:** the shader is the artifact; plumbing lives outside
  the shader; no hidden rewriting; the collaborator edits pieces and the
  person reads all of it; the agent gets its own tools, not its own
  dialect. The owner did not object but did not explicitly ratify them.

## Where this session contradicts the July design

| Topic | July design | Said in this session |
|---|---|---|
| Built-in names | `uTime`, `uResolution`, `uFrame`, `uPointer` (D023, ratified) | Recommended `iTime` everywhere for Shadertoy paste-compatibility |
| `webgl-demos` | Requirements corpus, never merge its architecture (D007) | Called 1.0 "more like a merge"; owner loosely agreed |
| Entry point name | `shade` (D005) | Suggested `render`; the collision worry was overstated, since GLSL overloading lets a user's own `shade(...)` coexist |
| Shadertoy names in native projects | Open (O014); interim "mix freely", walled option recommended | Assumed shared vocabulary |
| Custom uniforms | Not addressed as a visibility problem | Discussed declare-versus-inject at length; leaning inject plus visibility |
| Version | "0.4" | 1.0 |
| Old engine | New executor beside the old one, old deleted when compat is green (D010) | "Total rebuild from scratch" |

The July design is the more carefully argued on the first four rows. The
previous instance recommended deferring to it unless the owner reopens
them.

## What this session adds that the July design lacks

- The audience statement and the "shader is the artifact" principles.
- The agent workflow and tooling.
- The library as tested, readable modules with a GLSL test runner.
- The UI layer being open for redesign (July keeps the panels and leaves
  layouts open as O010).
- The 0.2.7 compatibility audit below.
- The uniform-visibility question.

## Compatibility audit: 0.2.7 to today

Baseline is commit `0c58c34` (published 0.2.7). Everything after it is
unpublished, so users migrate once, from 0.2.7 to 1.0.

| Contract | Change | Kind |
|---|---|---|
| Embeds | `<live-app>` removed; `<shader-canvas>`, `<shader-editor>` added; `<shader-sandbox>` kept | Loud for package-loaded `live-app`; self-hosted copies unaffected |
| Config | Quoted booleans, bad `pixelRatio`, `iChannel` mixed with named buffers are now errors | Loud |
| Config | `"current": true` used to read a stale texture; now reads latest and rejects impossible orderings | Silent, a bug fix; no demo used it |
| Script | `readPixels` returns `Float32Array` instead of bytes | Silent |
| Script | Raw struct-array data is packed differently | Silent |
| Library | `App`, `ShaderView`, layouts, `applyTheme` no longer exported | Loud |
| CLI | `shader render` and puppeteer removed | Loud |
| Scaffolds | Old scaffolded `main.ts` still runs but lacks `authorTools`, so no dev toolbar | Quiet loss |

Two facts about embeds: built folders bundle their own engine and are safe;
sites loading the runtime from an unpinned CDN URL get 1.0 the day it is
published, so the 1.0 loader must still read old configs.

## Observations on the current code

From the previous instance's first read; several are superseded by the
rebuild but are useful as a list of things not to repeat.

- Built-in uniforms are written out in three places (GLSL text twice,
  location cache, binder). One typed table should generate all three.
- `exportHTML.ts` is a second, hand-written engine embedded as a string.
- `ShaderProject` mixes what to render with how to present it, so the
  loader copies 14 fields in three places and `mount` needs casts.
- Error line mapping searches for marker comments; `#line` would be exact.
- The cubemap rewrite is a regex over the user's source and breaks on
  coordinates such as `f(a) + g(b)`.
- Multi-view is a separate project type with no author toolbar, capture
  or export.
- `iChannelTime` and `iSampleRate` are not declared, so pasted Shadertoy
  code that mentions them fails to compile.
- `tsc` fails on a fresh checkout until `predev` generates
  `src/project/generatedLoader`.
- Two stale comments in `types.ts`: one says users must declare uniforms
  (the engine injects them); `readPixels` is documented as `Uint8Array`.

## Open questions for the planning discussion

1. Reconcile the contradiction table above, row by row, with the owner.
2. How far does "from scratch" go? July keeps Transport, OfflineRenderer,
   std140, MediaManager, the CLI and the UI; the owner has since put the
   UI on the table.
3. What from `webgl-demos` is carried as ideas, what as ported projects,
   and is any code or library GLSL carried at all?
4. Inject or declare custom uniforms, and how they are made visible.
5. How kits and built-in cameras fit the July "systems" and "controllers".
6. Where agent tooling and the library sit in the roadmap stages.
7. The 1.0 stability promise: which surfaces are covered.
8. Which other repos count as "all my work".

## Suggested first message to the owner

After reading, report back with: what you read, the three or four places
where the sources disagree most, anything in section E or the agent
reports that changes the picture, and a proposed order for the planning
discussion. Then wait for their steer.
