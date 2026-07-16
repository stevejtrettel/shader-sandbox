# Shadertoy integration models

**Status: open decision (O014).** This document lays out the candidate
models with their pros, cons, and consequences so the choice can be made
deliberately. (An earlier draft marked one model settled without
ratification; nothing below is decided except the items listed as
settled context.)

## Settled context — true under every model

- **Standard is the default interpretation** of every project (D021).
  Nothing is ever silently interpreted as Shadertoy.
- **Compat scope is bounded**: the support matrix, pinned semantics, and
  conformance corpus of [SHADERTOY.md](SHADERTOY.md). Unsupported
  features fail loudly (D018).
- **One runtime** (D010): compat compiles into the same RuntimePlan/IR
  and executor. Shadertoy quirks never shape native semantics.
- **The translation table below is implemented under every model** — a
  pure Shadertoy folder must run regardless. The models differ in *where
  the vocabulary is permitted*, not in whether translations exist.

## The shared translation table

| Shadertoy construct | Native meaning |
|---|---|
| `mainImage(out vec4, in vec2)` | entry-point wrapper around a fragment pass |
| `iTime`, `iResolution`, `iFrame`, `iTimeDelta`, `iDate` | aliases for native built-ins |
| `iMouse` | derived uniform: native pointer state re-encoded in Shadertoy's sign convention |
| `iChannelN` + channel options | named resource reads with per-channel filter/vflip/wrap |
| BufferA–D, self-read = previous frame | feedback fields (`rgba32f`, size: view, resize: preserve, history 1) |
| A→B→C→D→Image timing | generated explicit schedule: `Sequence[Run A, Commit A, Run B, …]` |

Standing obligations this table places on the native model **regardless
of the integration choice**: resize-preserving view-sized resources,
per-channel vflip/filter options, and pointer state rich enough to
derive `iMouse`'s click encoding as a pure function.

## Model 1 — Walled opt-in

An explicit marker (`"shadertoy": true`; a documented content-sniff only
for bare configless `.glsl` files) selects the compat interpretation.
Native projects reject all Shadertoy vocabulary with pointed errors
("`mainImage` is Shadertoy vocabulary — add `\"shadertoy\": true` or
rename to `shade`").

**Pros:** maximal dialect purity — every project is unambiguously one
thing; the fidelity promise is trivially scoped (compat projects get it,
period); Shadertoy-shaped warts stay quarantined in one loader path;
docs and teaching never mix vocabularies.

**Cons:** pasting Shadertoy code into a native project fails until
renamed — migration is an *event*, not a gradient; the "which mode am I
in" question exists and every error message must answer it; the wall is
bureaucracy for the common case of grabbing one function from a
Shadertoy.

## Model 2 — Walled opt-in plus a names-only shim

Model 1, plus native projects may set `compatAliases: true` to get pure
renamings: `#define`s for `iTime`/`iResolution`/`iTimeDelta`/`iFrame`
and the `mainImage` wrapper. Excluded: `iMouse` and `iChannelN` — those
carry semantics (click encoding, channel/buffer behavior), and their
errors point to the compat mode or the native concepts.

**Pros:** line-by-line migration becomes possible while keeping the
mode wall; near-purity (the shim is a visible, declared seam); cheap to
implement; cheap to *widen later* (see reversibility).

**Cons:** the shim boundary feels arbitrary until explained (why
`iTime` but not `iMouse`? — names vs semantics); still a wall for
paste-and-run; two flags (`shadertoy`, `compatAliases`) to document.

## Model 3 — Ambient desugaring

All supported vocabulary is legal in any project because each construct
*means* its translation. Pasted Shadertoy code runs with no flag; a pure
Shadertoy folder desugars fully automatically; there is no loader
discriminator. Mixing vocabularies is legal, with one guardrail:
combining Shadertoy buffers with natively scheduled passes requires an
explicit schedule (frame structure is consequential ordering, never
guessed). An optional pure-compat marker (W104) restricts a project to
the support matrix and carries the conformance fidelity promise.

**Pros:** the best on-ramp in the product — paste, run, then grow
natively with no migration event; one loader path, no mode question;
conformance tests the exact code path users run; the Standard→Advanced
additivity story extends downward so the whole system is one gradient.

**Cons:** mixed-dialect code will exist in the wild forever — tutorials,
student code, and blog embeds will teach `iTime` alongside `uTime`, and
"what does a Standard project look like" gets fuzzier; every translated
construct becomes an *ambient* permanent obligation rather than a
quarantined one (the `iMouse` wart lives everywhere); namespace
collisions become possible (a native project declaring its own `iTime`
uniform now conflicts with an alias); the fidelity promise needs the
strict marker to mean anything. Mitigations: native docs use native
vocabulary only; a dev-server notice ("Shadertoy vocabulary in a native
project") marks the seam without erroring.

## Comparison

| | M1 wall | M2 wall + shim | M3 ambient |
|---|---|---|---|
| Paste Shadertoy code, it runs | needs flag | needs flag | yes |
| Line-by-line migration | poor | good | best |
| Ecosystem dialect purity | best | good | weakest |
| Loader | discriminator | discriminator | none |
| Fidelity promise | by mode | by mode | needs strict marker |
| Wart quarantine | full | near-full | none (ambient) |
| Docs burden | two vocabularies, separated | + shim page | + mixing rules |

## Reversibility and sequencing

M1 ⊂ M2 ⊂ M3: each later model only *adds* legal programs. Upgrading is
non-breaking at any time; downgrading breaks existing projects. So the
real decision is **how far to widen, and when** — and it does not block
the rebuild: Stages 0–1 (executor + conformance through the compat
translation) are identical under all three models. The choice must land
before Stage 2 freezes the native shader foundation's error behavior.

## Recommendation (advisory, not decided)

Ship the rebuild at **M2**, and revisit M3 after the native idiom exists
(post-Stage 4) with real evidence about whether the paste-and-run
on-ramp justifies ambient vocabulary. M3's strongest argument is the
on-ramp; its costs are permanent and its adoption is non-breaking later,
so deferring it is cheap and reversing it would not be.
