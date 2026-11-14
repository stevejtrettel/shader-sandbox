# Engine + project layer study (shader-sandbox 0.3.0, read-only)

All paths are relative to `/home/user/shader-sandbox/`. Nothing in either repo was modified; experiments ran on a copy under `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/engine/` (`repo/`, `exp1.ts`, `exp2.ts`).

Evidence tags: **[read]** = from reading code; **[ran]** = I executed it (vitest, tsc, or vite-node scripts against the real modules with fake file maps / a fake GL); **[infer]** = reasoning from code plus GLSL/WebGL rules. No real WebGL context was available, so nothing was actually compiled by a GLSL compiler.

Files read in full: `src/project/{types,loadProjectCore,configHelpers,loaderHelper,loaderUtils,FileLoader}.ts`, `src/engine/{ShaderEngine,shaderSource,UniformManager,std140,glHelpers,MediaManager,types}.ts`, `src/uniforms/UniformStore.ts`, tests `shaderSource/loadProjectCore/configHelpers/std140/UniformStore/errorOverlay`, README lines 46-260 and 389-422. All 102 tests pass [ran].

---

## 1. Project / config model

**Four accepted shapes**, dispatched in `loadProjectFromFiles` (`loadProjectCore.ts:352-398`):

| Shape | Trigger | Result |
|---|---|---|
| No config | no `config.json` | `image.glsl`, or bare `<root>.glsl` fallback (`:404-464`); mode `'standard'`, 4 empty channels. Node loader also rejects extra `.glsl` files and a `textures/` dir (`:433-448`); browser loaders skip those checks because `listGlslFiles`/`hasFiles` return `[]`/`false` (`loaderHelper.ts:104-113`). |
| Shadertoy | `mode === 'shadertoy'` | top-level keys `Image`, `BufferA..D`, each `{source?, iChannel0..3?}` (`:561-618`). No pass keys means `Image: {}`. |
| Standard + iChannel | no `mode`, no `buffers`/`textures`, some pass key | same `loadChannelPasses` as Shadertoy; only `project.mode` differs (`:647-665`). |
| Standard + named | non-empty `buffers` or `textures` | `loadStandardWithNamedBuffers` (`:709-826`). |

A fifth shape, multi-view (`views: [...]`), exists only in the Vite loader (`loaderHelper.ts:152-155, 189-275`). The core loader throws on it (`loadProjectCore.ts:381-386`). Each view is a single Image pass with no buffers or channels.

**How deep the Shadertoy shape goes.** It is the internal model, not just one input style:
- `PassName` is the fixed union `'Image'|'BufferA'|'BufferB'|'BufferC'|'BufferD'` (`types.ts:11`).
- `ShaderProject.passes` is a record with exactly those five keys (`types.ts:655-661`).
- `Channels` is a fixed 4-tuple (`types.ts:520`).
- Execution order is the constant `PASS_EXECUTION_ORDER` (`configHelpers.ts:69`).
- Named buffers are an alias layer: the i-th key of `buffers` becomes `BUFFER_PASS_NAMES[i]` (`loadProjectCore.ts:730-733`), max 4 (`:724-728`), file `<name>.glsl`. Every pass, including the buffer itself, receives the same `namedSamplers` map (`:738-800`).
- So JSON key order of `buffers` silently determines execution order, and therefore whether a cross-buffer read is this-frame or last-frame. README does not say this.

**Channel values** (`configHelpers.ts:44-63`, `loadProjectCore.ts:301-342`):
- Strings: a `PassName` is a buffer; `"keyboard"`, `"audio"`, `"webcam"` are special; any other string is a texture path.
- Objects: `{buffer, current?}`, `{texture, filter?, wrap?, type?: '2d'|'cubemap'}`, `{keyboard}`, `{audio}`, `{webcam}`, `{video}`, `{script}`.
- Normalised to `ChannelSource` (`types.ts:507-515`).

**Named-mode `textures` values** are strings only: special source, path with an extension, or otherwise a script-texture name (`loadProjectCore.ts:744-765`). There are no filter/wrap options, no cubemap, no video. Image textures always get linear/repeat (`:759`, default at `:282`).

**Top-level fields**: `mode, title, author, description, layout, theme, controls, stats, playback, uniformsUI, common, startPaused, stickyMouse, pixelRatio, uniforms, buffers, textures, Image, BufferA-D, views` (`configHelpers.ts:126-132`).

**Normalisation.** `buildShaderProject` fills defaults (`loadProjectCore.ts:70-96`): layout `'default'`, theme `'auto'`, title = last path segment. Textures are deduplicated by `source|filter|wrap` into `tex0..` (`:279-295`). `common.glsl` is auto-detected if `common` is not given (`:256-273`).

**Validation that exists** (`configHelpers.ts:142-295`, `loadProjectCore.ts:108-198`):
- Unknown top-level and pass keys warn only.
- Enums for layout, theme, uniformsUI, and buffer filter/wrap.
- Strict booleans; positive `pixelRatio`.
- `buffers`/`textures` rejected in Shadertoy mode; iChannel and named styles are mutually exclusive.
- Uniform names checked against a reserved list and a GLSL identifier regex.
- Buffer/texture name collision.
- Uniform type and value shape.
- `current: true` ordering (`loadProjectCore.ts:536-556`).

**Validation gaps** [ran, `exp2.ts`]:
- `mode: "shadertoyy"` is silently treated as standard (mode is never validated).
- `iChannel0: "bufferA"` (case typo) becomes a texture path and fails with "Image not found".
- `iChannel0: 5` throws a raw `TypeError: Cannot use 'in' operator`.
- A reference to an unconfigured `BufferA` only warns; the engine then `console.warn`s every frame and binds black (`ShaderEngine.ts:1239-1242`).
- `"Image"` is accepted as a channel source (Image reading its own previous frame works, because Image is ping-ponged too).
- `bufferA.glsl` present on disk but absent from config is silently ignored.
- In named mode a pass-level `Image: {source}` is silently ignored (always `image.glsl`, `:770`).
- Texture channel `filter`/`wrap`/`type` values are unvalidated [read].
- `int` accepts `1.5`; `min > max` is accepted.
- A scalar definition that also has `count` silently becomes a UBO array, because `isArrayUniform` keys on the presence of `count` (`types.ts:153-155`).
- Struct field names are not checked as identifiers.
- A buffer named `iTime` or a texture named `iResolution` is accepted; reserved names are only checked for uniforms.
- The reserved list (`configHelpers.ts:89-95`) lacks `iMousePressed`, `<name>_count`, `<name>_resolution`, `fragColor`, `ST_PI`, `ST_TWOPI`, `_st_*`, `_ub_*`, `iMouse_<view>`, and the `KEY_*`/`keyDown` helpers. A uniform named `iMousePressed`, `fragColor`, `main`, `texture`, `uint` or `sampler3D` passes validation.

---

## 2. What the engine injects or rewrites

Single function `buildFragmentShader` (`shaderSource.ts:122-294`).

**Assembly order:** preamble → common → built-in uniforms → cross-view uniforms → named samplers → keyboard helpers → UBO blocks → scalar custom uniforms → (cubemap-rewritten) user source → `main` wrapper.

**Actual generated output** [ran, `exp1.ts`; iChannel branch with a common file, one vec3 array, one struct array, one float uniform]:

```
  1| #version 300 es
  2| precision highp float;
  3|
  4| // Shadertoy compatibility: equirectangular texture sampling
  5| const float ST_PI = 3.14159265359;
  6| const float ST_TWOPI = 6.28318530718;
  7| vec2 _st_dirToEquirect(vec3 dir) {
  8|   float phi = atan(dir.z, dir.x);
  9|   float theta = asin(dir.y);
 10|   return vec2(phi / ST_TWOPI + 0.5, theta / ST_PI + 0.5);
 11| }
 12|
 13| // Common code
 14| float sq(float x){return x*x;}
 15|
 16| // Shadertoy built-in uniforms
 17| uniform vec3  iResolution;
 18| uniform float iTime;
 19| uniform float iTimeDelta;
 20| uniform int   iFrame;
 21| uniform vec4  iMouse;
 22| uniform bool  iMousePressed;
 23| uniform vec4  iDate;
 24| uniform float iFrameRate;
 25| uniform vec3  iChannelResolution[4];
 26| uniform sampler2D iChannel0;   (…1, 2, 3 on lines 27-29)
 31| // Shader Sandbox touch extensions (not in Shadertoy)
 32| uniform int   iTouchCount;
 33| uniform vec4  iTouch0;   (iTouch1, iTouch2)
 36| uniform float iPinch;
 37| uniform float iPinchDelta;
 38| uniform vec2  iPinchCenter;
 40| // Array uniform: pts (max 4)
 41| layout(std140) uniform _ub_pts {
 42|   vec3 pts[4];
 43| };
 44| uniform int pts_count;
 46| // Struct array uniform: seeds (max 8)
 47| struct _st_seeds {
 48|   vec3 position;
 49|   vec4 color;
 50| };
 51| layout(std140) uniform _ub_seeds {
 52|   _st_seeds seeds[8];
 53| };
 54| uniform int seeds_count;
 56| // Custom uniforms
 57| uniform float uSpeed;
 59| // User shader code
 60| void mainImage(...) {...}
 64| // Main wrapper
 65| out vec4 fragColor;
 67| void main() {
 68|   mainImage(fragColor, gl_FragCoord.xy);
 69| }
```

**Built-ins, complete list.**
- Always: `vec3 iResolution`, `float iTime`, `float iTimeDelta`, `int iFrame`, `vec4 iMouse`, `bool iMousePressed`, `vec4 iDate`, `float iFrameRate`, `int iTouchCount`, `vec4 iTouch0/1/2`, `float iPinch`, `float iPinchDelta`, `vec2 iPinchCenter`.
- iChannel branch only: `vec3 iChannelResolution[4]`, `sampler2D iChannel0..3` (`shaderSource.ts:184-207`).
- Named branch instead: `uniform sampler2D <name>; uniform vec3 <name>_resolution;` per sampler (`:170-174`). There is no `iChannel*` in this branch.
- Multi-view: `vec4 iMouse_<v>`, `vec3 iResolution_<v>`, `bool iMousePressed_<v>` per view (`:159-167, 210-218`).
- Not declared anywhere: `iChannelTime`, `iSampleRate`, `iChannel*` as `samplerCube`/`sampler3D`.

**The branch is chosen by `namedSamplers.size > 0`, not by `project.mode`** (`shaderSource.ts:136`). `mode` has no engine effect at all [read: engine never reads `project.mode`].

**Keyboard helpers.** `KEY_*` constants and `keyDown/keyToggle/isKeyDown/isKeyToggled` (`shaderSource.ts:47-94`) are injected only in the named branch, and only when a sampler is literally named `keyboard` (`:178`). The helpers hard-code the identifier `keyboard`. [ran] `textures: {kb: "keyboard"}` gets no helpers. A texture named `keyboard` bound to an image would get helpers that read the image [infer].

**Cubemap "support"** is a textual rewrite (`shaderSource.ts:299-320`). For channels flagged `cubemap`, the regex `/texture\s*\(\s*(iChannel[0-3])\s*,\s*([^)]+)\)/g` wraps the coordinate in `_st_dirToEquirect(...)`. The texture is an ordinary 2D equirect image. It is applied to the pass source only, not to common. See 6c for failure cases.

**mainImage wrapping.** `out vec4 fragColor;` and `main()` are appended after user code (`:264-270`). There is no check that `mainImage` exists, no alpha forcing, and no `precision highp int` or sampler precision line.

**Error mapping.** No `#line` anywhere (grep of `src` is empty). After joining, the code scans for lines exactly equal to `// Common code` and `// User shader code` (`:274-288`) and returns `{commonStartLine, commonLines, userCodeStartLine}`. Consumers: `ShaderEngine.ts:997-1015` (first error only) and `app/ErrorOverlay.ts:135-159` (per error line: "common.glsl line N" / "Line N" / "Generated preamble line N").

---

## 3. Frame execution semantics

`ShaderEngine.step` (`ShaderEngine.ts:371-442`):

1. `dt = time − lastStepTime` (0 on first call). Builtins are computed once for all passes. `iFrameRate = dt > 0 ? 1/dt : 60` (`:412`). `iDate` month is 0-11.
2. One viewport for all passes (`:422`). Every pass, Image included, renders at canvas size into its own RGBA32F target.
3. For each of `BufferA, B, C, D, Image` that exists: `executePass` draws into `currentTexture`, then the swap happens immediately (`:427-435`, `:1337-1355`). After the swap, `previousTexture` is the output just rendered.
4. Clear scalar dirty flags; `iFrame++` after all passes (`:438-441`).

**Read rule.** Every buffer read returns `targetPass.previousTexture` (`:1236-1251`), meaning the latest completed output:
- Self-read: last frame (the pass's own swap has not happened yet).
- Read of an earlier pass: this frame.
- Read of a later pass: last frame.

This matches Shadertoy and never forms a feedback loop.

**`"current": true` has no runtime effect.** The engine comment says so explicitly (`:1244-1249`). It is purely a load-time ordering assertion: it rejects self-references and sources that are not strictly earlier (`loadProjectCore.ts:536-556`, tested). In named mode it is always `false` (`:741`).

**Presentation.** Image is also ping-ponged to float. `bindImageForRead` temporarily attaches `previousTexture`, and `ShaderView` blits it to the canvas with NEAREST (`ShaderEngine.ts:328-362`, `app/ShaderView.ts:193-205`).

**Resize** (`ShaderEngine.ts:448-468`). Deletes and reallocates both textures and the FBO of every pass. Contents are lost; time and frame are untouched. The caller (`ShaderView.ts:136-140`) debounces 150 ms and then always calls `reset()`, so any resize restarts accumulation and simulations. There is no content-preserving resize and no fixed-size or scaled buffer.

**Reset** (`:474-506`). `iFrame = 0`, clears both textures of every pass to (0,0,0,0). It does not reset `_lastStepTime`. Because `App.reset` rewinds the transport first (`app/App.ts:571-577`), the first frame after a reset gets a negative `iTimeDelta` [infer].

**Formats and sampling.**
- All targets are RGBA32F (`glHelpers.ts:152-194`). `EXT_color_buffer_float` is mandatory: the constructor throws without it, with no RGBA16F/RGBA8 fallback (`ShaderEngine.ts:738-747`).
- Buffer default is NEAREST + CLAMP with no mipmaps. `linear`/`repeat` are available only through named-mode `buffers.<name>.{filter,wrap}` (`loadProjectCore.ts:793-800`). They are a property of the buffer, not of the read.
- iChannel-style buffers are always nearest/clamp, with no way to change it.
- `linear` without `OES_texture_float_linear` falls back to nearest with a warning (`ShaderEngine.ts:858-869`).
- Unbound channels get a 1×1 float (0,0,0,1) texture and resolution (0,0) (`glHelpers.ts:238-272`, `ShaderEngine.ts:1298`).
- Buffer resolution is always reported as canvas size (`:1301`).

**Compile failure at load.** The failed pass is simply absent from `_passes` (`:992-1026`). Readers of it get black plus a per-frame warning. If Image fails, nothing is presented. `recompilePass` can later build the missing pass from scratch (`:564-595`).

---

## 4. Uniform system

**Scalars**: `float, int, bool, vec2, vec3, vec4` (`types.ts:30`). No `mat*`, `ivec*` or `uint` scalars.
- Declared automatically as `uniform <type> <name>;` (`shaderSource.ts:246-254`).
- Values live in `UniformStore`, which clones on get and set (`uniforms/UniformStore.ts`).
- Upload is dirty-tracked: only changed scalars are re-sent, for every pass, then the dirty set is cleared after the frame (`UniformManager.ts:528-569`). After a recompile, all are marked dirty (`ShaderEngine.ts:590, 616`).

**Controls mapping.** The definition is the control spec:
- float/int → slider (`min/max/step`)
- bool → toggle
- vec2 → XY pad
- vec3/vec4 → sliders, or a colour picker with `color: true`
- `hidden: true` or any UBO uniform → no UI (`types.ts:175-177`)

**Arrays (UBO)**: `{type: float|vec2|vec3|vec4|mat3|mat4, count, data?}`. **Struct arrays**: `{struct: {field: type}, count, data?}`.
- Each gets one `layout(std140) uniform _ub_<name>` block, one binding point in definition order (`UniformManager.ts:622-640`), and a plain `uniform int <name>_count` holding the active element count. The count is re-sent every pass (`:522-525`).
- `MAX_UNIFORM_BLOCK_SIZE` and binding count are checked with clear errors (`:687-694`).
- `data` JSON is loaded by the loader into `project.uniformData` (`loadProjectCore.ts:208-250`) and applied in the constructor (`UniformManager.ts:605-616`).

**std140** (`std140.ts`).
- Array elements are padded to a 16-byte stride; mat3 becomes three vec4 columns (`:30-37, 97-119`).
- Struct layout: per-field alignment 4/8/16, stride rounded to 16 (`:190-218`). I hand-checked `{vec3 p; float w; vec4 c}` → offsets 0/12/16, stride 32 [ran]. That is correct std140: the float packs into the vec3's fourth slot.

**Script API** (`types.ts:776-834`): `setUniformValue` (scalars; a tight `Float32Array` for arrays and structs), `setArrayUniform`, `setArrayElement`, `setActiveCount`, `setStructArrayUniform`, `setStructArrayElement`, `updateTexture`, `readPixels`.

**Defects found** [ran, `exp2.ts`, fake GL]:
- `setPlainArrayRaw` stores the value before validating (`UniformManager.ts:154` vs `:162-169`).
- After `setArrayUniform` with k < count elements, `getUniformValue` returns length k·cpe, not capacity. A later `setArrayElement(i ≥ k)` writes the UBO but the store write falls off the end of the short typed array. Store and GPU diverge, and `activeCount` jumps over a zero-filled gap.
- The store holds a `subarray` of the reusable scratch buffer (`:275, 298`), i.e. aliasing.
- A flat `number[]` longer than capacity is silently truncated (`:274`). The nested form warns.
- A `Float32Array` for a vec scalar is rejected with "expected array for vec3, got object" (`:138`).
- `setStructArrayUniform` with a shorter field array zero-fills everything past the new element count. Setting `{w: [7]}` after two elements wiped element 1 and set `activeCount` to 1, despite the doc saying "omitted fields preserve their existing values" (`:350, 395-405`).

---

## 5. Media

| Source | Support | Evidence |
|---|---|---|
| 2D image | `Image()` load, `crossOrigin=anonymous`, `UNPACK_FLIP_Y`, RGBA8 (no sRGB). Linear means trilinear plus `generateMipmap`. Default linear/repeat. 1×1 black placeholder until loaded; `iChannelResolution` is 1×1 until then. | `ShaderEngine.ts:877-939` |
| Cubemap | Equirect 2D image plus source regex; iChannel style only. No `samplerCube`, no 6-face, no 3D/volume textures. | `shaderSource.ts:299-320` |
| Video file | `<video>` muted/loop/autoplay, re-uploaded every frame, LINEAR/CLAMP, no mipmaps. `src` is the raw config string, not resolved against the project root (`loadProjectCore.ts:324`; only textures go through `textureUrlResolver`). Not synced to the transport, so offline renders are non-deterministic [infer]. | `MediaManager.ts:196-234, 253-264` |
| Webcam | `getUserMedia({video})` after first gesture; one shared texture. | `MediaManager.ts:151-194` |
| Audio | Microphone only. 512×2 R8: row 0 FFT (fftSize 1024, smoothing 0.8), row 1 waveform. No audio-file/music channel, no sound pass, no `iSampleRate`/`iChannelTime`. | `MediaManager.ts:116-149`, `glHelpers.ts:387-422` |
| Keyboard | 256×3 RGBA32F. Row 0 held, row 2 toggle. Row 1 ("pressed this frame" on Shadertoy) is never written. `engine/types.ts:137-138` claims it is. | `glHelpers.ts:333-376` |
| Script texture | `updateTexture(name,w,h,data)`: Uint8 → RGBA8, Float32 → RGBA32F, always NEAREST/CLAMP. | `ShaderEngine.ts:179-204`, `glHelpers.ts:470-495` |

Named-sampler binding uses one texture unit per sampler with no `MAX_TEXTURE_IMAGE_UNITS` check (`ShaderEngine.ts:1203-1222`). Dispose-during-permission-prompt and double-init are handled (`MediaManager.ts:26-32, 130-134, 165-178`).

---

## 6. Verdicts on the previous reader's claims

**a. Built-ins written in three places: PARTLY (understated).** The three named are real: GLSL text twice (`shaderSource.ts:138-156` and `:184-207`), location cache (`ShaderEngine.ts:773-802`), binder (`:1088-1150`). There are at least five more:
- `PassUniformLocations` (`engine/types.ts:49-69`)
- `BuiltinUniformValues` (`engine/types.ts:193-206`)
- value construction (`ShaderEngine.ts:399-419`)
- reserved-name list (`configHelpers.ts:89-95`)
- a second location cache and binder inside `app/exportHTML.ts:397-405, 638-644`

The copies have already drifted: the reserved list lacks `iMousePressed` [ran: accepted as a custom uniform name; redeclaration failure at compile is inferred].

**b. Marker-comment line mapping, not `#line`: VERIFIED** (`shaderSource.ts:274-288`). Additional fragility:
- A user line exactly `// User shader code` shifts the mapping; the last match wins [ran: reported 40, true 38].
- A multi-line `texture(iChannel0,\n rd)` on a cubemap channel is collapsed to one line by the rewrite, shifting every later line by −1 [ran].
- `recompilePass` discards `lineMapping` (`ShaderEngine.ts:562`) and returns the raw log. `editor/EditorPanel.ts:353` shows it verbatim, so live-edit errors carry compiled-source line numbers. Only load-time errors are mapped.

**c. Cubemap regex breaks on `f(a) + g(b)`: VERIFIED** [ran]. Output is `texture(iChannel0, _st_dirToEquirect(f(a)) + g(b))`. `[^)]+` stops at the first `)`. It works only when everything after the first `)` is closing parentheses, which is why `normalize(vec3(c,1.0))` and `reflect(rd,n)` pass. Other failures [ran]:
- `normalize(rd) * rot`
- `vec3(x).zyx`
- three-argument `texture(ch, rd, bias)`
- `textureLod(...)` is not rewritten at all
- no word boundary, so `mytexture(` is rewritten
- comments are rewritten

**d. `iChannelTime`/`iSampleRate` not declared: VERIFIED** [grep: zero hits in `src`]. That it fails to compile is [infer] (undeclared identifier). `docs/architecture/SHADERTOY.md:28-31` lists both as "Supported"; that describes the planned design, not `src`.

**e. `tsc` fails on a fresh checkout: VERIFIED** [ran]. Exactly one error: `src/main.ts(18,44): TS2307 Cannot find module './project/generatedLoader'`. After `node scripts/generate-loader.cjs`, tsc exits 0. The file is gitignored. `npm test` does not need it (102/102 pass without it). `npm run build` and `dev` are covered by the `prebuild`/`predev` hooks.

**f. Two stale comments: VERIFIED / PARTLY.**
- `types.ts:672` "Users must declare these uniforms in their shader code": VERIFIED stale (they are injected, `shaderSource.ts:246-254`).
- `readPixels`: PARTLY. The JSDoc at `types.ts:781` says "Returns RGBA Uint8Array", but the signature on `:782` and the engine (`ShaderEngine.ts:209-231`) are `Float32Array`.

More stale comments:
- `types.ts:28` "we start with float only"
- `types.ts:214` "By default, reads the previous frame" (contradicted by the next sentence)
- `types.ts:607` theme "Defaults to 'light'" (actual: `'auto'`, `configHelpers.ts:82`)
- `types.ts:665` `kind: 'texture2D'` (actual: `'texture'`)
- `engine/types.ts:137-138` keyboard row 1
- `ShaderEngine.ts:4`, `glHelpers.ts:7`, `engine/types.ts:5` cite `docs/engine-spec.md`, which does not exist
- `loadProjectCore.ts:2` cites `loadProject.ts`, which does not exist

**g. `ShaderProject` mixes render and presentation; loader copies ~14 fields in three places: VERIFIED.**
- `ShaderProject` (`types.ts:583-694`) carries `meta, layout, theme, controls, stats, playback, uniformsUI, startPaused, stickyMouse, pixelRatio` next to `passes, textures, uniforms, uniformData, commonSource, script`.
- The same 12 metadata/presentation fields are forwarded verbatim in three `buildShaderProject` calls (`loadProjectCore.ts:595-617, 678-700, 803-825`).
- They are enumerated again in `ShaderProjectInput` (`:42-64`), `buildShaderProject` (`:70-96`), both config interfaces (`types.ts:343-393, 413-453`), `MultiViewProject` (`types.ts:721-743`) and the multi-view literal (`loaderHelper.ts:251-274`).
- The engine reads only `passes, textures, uniforms, uniformData, commonSource` [grep of `project.` in `src/engine`].

---

## 7. My own findings

### Weaknesses, coupling, bugs

1. **Common code is emitted before the uniform declarations** [ran: common at line 14, uniforms from line 16]. Functions in `common.glsl` therefore cannot reference `iTime`, `iResolution`, `iChannel*`, custom uniforms or UBO arrays (GLSL needs declaration before use) [infer]. Shadertoy's Common tab can use them. Macros still work. Evidence that it bites: `/home/user/webgl-demos/demos/OLD_WAVE/common.glsl:6` hand-declares `uniform vec3 iResolution;`.
2. **`"data"` files cannot load through `loadDemo`** (dev server, CLI build, templates) [ran]. `createBrowserFileLoader` is built from the GLSL and image maps only (`loaderHelper.ts:78-86, 162`); JSON files are never visible to `exists`/`readText`. It throws "data file './data.json' not found". `demos/examples/json-data` uses this feature. The fetch runtime (`runtime.ts:55-65`) is unaffected. Not checked in a real browser.
3. **The engine mutates its input.** `recompilePass` writes `projectPass.glslSource` (`ShaderEngine.ts:588, 609`) and `recompileCommon` writes `project.commonSource` (`:637, 655`). On partial failure, `recompileCommon` re-compiles the passes that succeeded back to the old source (`:654-671`).
4. **`mode` is a label with no engine meaning** (see section 2). "Standard + iChannel" is byte-identical to Shadertoy mode at runtime.
5. **Buffer sampling state is per buffer, with no mipmaps, and unavailable in iChannel style.** Shadertoy sets filter/wrap per input, and to my recollection defaults buffer inputs to linear. Pasted multi-pass shaders that rely on linear buffer reads will look different [infer].
6. **Every resize is a reset** (section 3). This is a caller decision, but the engine offers no alternative.
7. **Precision.** Only `precision highp float;` is declared. Fragment-shader `int` defaults to mediump and samplers to lowp in GLSL ES 3.00, so integer hash code and float-buffer reads may differ on mobile GPUs [infer; not tested].
8. **Float colour buffers are a hard requirement**, with no downgrade path (`ShaderEngine.ts:742-747`).
9. **Per-frame waste.** The keyboard texture allocates and uploads a 256×3 float array every frame even when unused (`glHelpers.ts:341`, `ShaderView.ts:168`). `_passes.find` and `_textures.find` are linear lookups per bind. `new Date()` is created every step.
10. **Other small defects.**
    - `readPixels` reads only `previousTexture` at canvas resolution and is typed `PassName`, but scripts in named mode know buffer names, not `BufferA` (`App.ts:326` casts `as any`).
    - `iFrameRate` is the instantaneous 1/dt.
    - Texture load does `console.log` on success (`ShaderEngine.ts:931`).
    - Multi-view common ignores the `common` config field (`loaderHelper.ts:207-212`).
    - Plus the uniform-manager defects (section 4) and validation gaps (section 1).

### Worth preserving

- **The ping-pong rule itself**: swap immediately after each pass and always read `previousTexture`. One invariant gives Shadertoy semantics and makes feedback loops impossible (`ShaderEngine.ts:427-435, 1244-1250`). The `current: true` idea as a checked ordering assertion, not a runtime switch, is a good design.
- **Rendering Image to an offscreen float target and blitting.** This makes screenshots, offline renders and `readPixels` uniform, and lets Image feed back on itself.
- **`readPixels` as RGBA/FLOAT** with the note that byte reads of float FBOs return zeros (`:221-224`).
- **std140 packer and struct layout** (`std140.ts`), well tested (`tests/std140.test.ts`), including the vec4/mat4 "must honour `out`" regression and stale-padding overwrite.
- **Active-count design**: fixed-capacity UBO plus a `<name>_count` int.
- **Pre-allocated `paddedData`/scratch buffers** and single-element repack (`UniformManager.ts:305-342`).
- **GL limit checks with readable errors** (`UniformManager.ts:687-694`).
- **Dirty-scalar tracking** with "mark all dirty after relink".
- **Live-edit resilience**: keep the old program on failure; build a pass that failed at load from scratch; delete the vertex shader on fragment failure (`glHelpers.ts:51-58`).
- **Media lifecycle guards**: dispose-during-`getUserMedia`, de-duplicated init promises (`MediaManager.ts:26-32`).
- **`_disposed` / `isContextLost` guards** in async image `onload` (`ShaderEngine.ts:906`).
- **`fragmentSource` kept on the runtime pass** so HTML export embeds exactly what compiled (`engine/types.ts:115-118`).
- **Placeholder textures with real resolution reported once loaded**; black 1×1 for unbound channels; fullscreen triangle.
- **The `FileLoader` abstraction** with one core loader for Node, Vite and fetch, and the in-memory test loader pattern (`tests/loadProjectCore.test.ts:8-26`).
- **Validation style**: collect all errors, warn on unknown keys, strict-boolean check for `"controls": "false"`, bare `<root>.glsl` fallback, case-insensitive file lookup.
- **Per-error-line classification** in `parseShaderError` (common / user / preamble) and its hint texts.
- **`iMousePressed`, touch/pinch uniforms and `<name>_resolution`** as extensions.

---

## 8. Things a designer of the replacement would regret not knowing

1. **Named buffers are not a second model.** They are BufferA-D renamed, capped at 4, executed in JSON key order, with every sampler bound in every pass. There is no dependency graph, no per-buffer size or format, and no declared read intent.
2. **`current: true` does nothing at runtime, and `mode` does nothing in the engine.** Both exist only at load/validation level.
3. **Common precedes the uniforms**, so "common is prepended" (README:152-155) is literally true and weaker than Shadertoy's Common.
4. **There are two engines.** `app/exportHTML.ts` re-implements location caching, binding, the keyboard texture and `readPixels` as a string. Any uniform-table design must feed both, or delete one.
5. **Two error paths**: load-time (mapped, overlay) and live-edit (unmapped, raw log).
6. **README versus code.** These are undocumented:
   - `iChannelResolution`
   - `<name>_resolution`
   - the keyboard helpers and their dependence on the sampler being named `keyboard`
   - buffer-order semantics
   - `"Image"` as a channel source
   - the bare `{script: name}` channel

   README "reads its own previous frame (ping-pong)" (README:107) is right. README "`common.glsl line N` vs `Line N`" is true only at load.
7. **Demo corpus** (both repos, 44 `config.json`): 8 use `mode: shadertoy`, 5 use named `buffers`, none use `current`, none use cubemap or video, and one each uses audio and webcam. Most are single-pass with uniforms. The cubemap rewrite, video and `current` are effectively unexercised.
8. **Presentation-only test coverage of the engine is zero.** `ShaderEngine`, `UniformManager`, `MediaManager` and `glHelpers` have no tests. Only the pure functions (`shaderSource`, `std140`, loader, validation) are tested. The uniform-manager defects in section 4 were found with a 10-line Proxy fake GL, so that layer is cheaply testable.

Key files (absolute):
- `/home/user/shader-sandbox/src/engine/ShaderEngine.ts`
- `/home/user/shader-sandbox/src/engine/shaderSource.ts`
- `/home/user/shader-sandbox/src/engine/UniformManager.ts`
- `/home/user/shader-sandbox/src/engine/std140.ts`
- `/home/user/shader-sandbox/src/engine/glHelpers.ts`
- `/home/user/shader-sandbox/src/engine/MediaManager.ts`
- `/home/user/shader-sandbox/src/project/types.ts`
- `/home/user/shader-sandbox/src/project/loadProjectCore.ts`
- `/home/user/shader-sandbox/src/project/configHelpers.ts`
- `/home/user/shader-sandbox/src/project/loaderHelper.ts`

Experiment scripts:
- `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/engine/exp1.ts`
- `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/engine/exp2.ts`
