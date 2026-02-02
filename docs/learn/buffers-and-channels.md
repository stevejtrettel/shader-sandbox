# Buffers and Channels

Multi-pass rendering unlocks powerful effects like feedback loops, blur, and accumulation. This guide explains how to use buffers and channels to create complex shaders.

## Why Use Multiple Buffers?

A single-pass shader calculates each frame independently - it doesn't remember what it drew last frame. But many effects need **temporal persistence**:

### Common Use Cases

**Feedback Effects** - Read what you drew last frame to create trails, motion blur, or organic growth patterns

**Blur & Post-Processing** - Render to a buffer, then read and blur it in the final Image pass

**Accumulation** - Build up detail over many frames (path tracing, progressive rendering)

**Game of Life / Simulations** - Store state in a buffer, update it based on neighbors

**Multi-Stage Pipelines** - Break complex effects into simple steps

## Understanding Passes

Shader Sandbox supports up to **5 passes** that run in order each frame:

1. **BufferA** - Runs first
2. **BufferB** - Runs second
3. **BufferC** - Runs third
4. **BufferD** - Runs fourth
5. **Image** - Runs last (always required, displays to screen)

Each pass is a separate shader file with its own `mainImage()` function.

**Important**: The Image pass is the only one displayed on screen. All buffer passes are just for intermediate computations.

## What are Channels?

Channels (`iChannel0` through `iChannel3`) are how shaders **read textures and buffers**. Each pass has 4 channels it can read from.

Think of channels like input ports:
- BufferA writes to a texture
- Image reads from `iChannel0` which points to BufferA's texture
- Now Image can see what BufferA drew!

### Channel Types

You can bind several types of resources to channels:

1. **Buffers** - Read from another pass
2. **Textures** - Read from an image file
3. **Keyboard** - Read keyboard state
4. **Audio** - Microphone FFT spectrum and waveform
5. **Webcam** - Live camera feed
6. **Video** - Video file playback
7. **Script** - Texture uploaded from JavaScript

## Basic Multi-Pass Example

Let's create a feedback effect where each frame fades and draws a new circle.

### Step 1: Create Config

`shaders/feedback-demo/config.json`:

```json
{
  "title": "Feedback Demo",
  "BufferA": {
    "iChannel0": "BufferA"
  },
  "Image": {
    "iChannel0": "BufferA"
  }
}
```

### Step 2: Create BufferA

`shaders/feedback-demo/bufferA.glsl`:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Read what we drew last frame (from iChannel0)
    vec3 previous = texture(iChannel0, uv).rgb;

    // Fade it out slowly
    vec3 color = previous * 0.95;

    // Add a moving circle
    vec2 center = 0.5 + 0.3 * vec2(sin(iTime), cos(iTime));
    float dist = length(uv - center);
    color += smoothstep(0.05, 0.04, dist);

    fragColor = vec4(color, 1.0);
}
```

### Step 3: Create Image

`shaders/feedback-demo/image.glsl`:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Just display what BufferA rendered
    vec3 color = texture(iChannel0, uv).rgb;

    fragColor = vec4(color, 1.0);
}
```

**What's happening:**
1. BufferA reads its own previous frame (self-reference detected automatically)
2. It fades the previous frame and adds a new circle
3. Image displays BufferA's output
4. This creates a trail effect!

## Reading Buffers

### String Shorthand

```json
"iChannel0": "BufferA"
```

When a buffer references itself, the engine automatically reads the **previous frame** and creates ping-pong textures. When a later pass references an earlier buffer (e.g. Image referencing BufferA), it reads the **current frame**.

### Object Form

```json
"iChannel0": { "buffer": "BufferA" }
```

### Self-reference (Feedback Loop)

```json
{
  "BufferA": {
    "iChannel0": "BufferA"
  }
}
```

BufferA reads its own previous frame. The engine handles ping-pong textures automatically.

### Sampling in GLSL

To read from a channel, use the `texture()` function:

```glsl
vec4 color = texture(iChannel0, uv);
```

Where:
- `iChannel0` - The channel to read from (0-3)
- `uv` - Normalized coordinates (0-1)
- Returns `vec4` with RGBA values

## Example: Two-Pass Blur

Separable blur: BufferA renders content, BufferB blurs horizontally, Image blurs vertically.

**Important**: Passes execute in order: BufferA -> BufferB -> BufferC -> BufferD -> Image. Each pass can read the current frame from passes that ran *before* it.

`config.json`:
```json
{
  "BufferA": {},
  "BufferB": {
    "iChannel0": "BufferA"
  },
  "Image": {
    "iChannel0": "BufferB"
  }
}
```

`bufferA.glsl` - Render something to blur:
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 color = vec3(uv, sin(iTime));
    fragColor = vec4(color, 1.0);
}
```

`bufferB.glsl` - Horizontal blur:
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 color = vec3(0.0);

    for (float i = -4.0; i <= 4.0; i++) {
        vec2 offset = vec2(i / iResolution.x, 0.0);
        color += texture(iChannel0, uv + offset).rgb;
    }
    color /= 9.0;

    fragColor = vec4(color, 1.0);
}
```

`image.glsl` - Vertical blur:
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 color = vec3(0.0);

    for (float i = -4.0; i <= 4.0; i++) {
        vec2 offset = vec2(0.0, i / iResolution.y);
        color += texture(iChannel0, uv + offset).rgb;
    }
    color /= 9.0;

    fragColor = vec4(color, 1.0);
}
```

## Loading External Textures

Put your image in the shader folder and reference it in config:

```json
{
  "Image": {
    "iChannel0": "photo.jpg"
  }
}
```

With options:
```json
{
  "Image": {
    "iChannel0": {
      "texture": "photo.jpg",
      "filter": "linear",
      "wrap": "repeat"
    }
  }
}
```

**Filter**: `linear` (smooth, default) or `nearest` (pixelated)

**Wrap**: `repeat` (tiles, default) or `clamp` (edge stretch)

## Keyboard Input

### Standard Mode (recommended)

Add `"keyboard": "keyboard"` to your textures. The sampler **must** be named `keyboard`.

```json
{
  "textures": {
    "keyboard": "keyboard"
  }
}
```

The engine auto-injects key constants and helper functions:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    vec2 pos = vec2(0.5);
    pos.x += (keyDown(KEY_D) - keyDown(KEY_A)) * 0.3;
    pos.y += (keyDown(KEY_W) - keyDown(KEY_S)) * 0.3;

    float circle = smoothstep(0.1, 0.09, length(uv - pos));
    fragColor = vec4(vec3(circle), 1.0);
}
```

### Auto-Injected Helpers

| Function | Returns | Description |
|----------|---------|-------------|
| `float keyDown(int key)` | `1.0` / `0.0` | Whether key is currently held down |
| `float keyToggle(int key)` | `1.0` / `0.0` | Flips each time the key is pressed |
| `bool isKeyDown(int key)` | `true` / `false` | Boolean version of keyDown |
| `bool isKeyToggled(int key)` | `true` / `false` | Boolean version of keyToggle |

Available constants: `KEY_A`-`KEY_Z`, `KEY_0`-`KEY_9`, `KEY_LEFT`/`UP`/`RIGHT`/`DOWN`, `KEY_SPACE`, `KEY_ENTER`, `KEY_TAB`, `KEY_ESC`, `KEY_SHIFT`, `KEY_CTRL`, `KEY_ALT`, `KEY_F1`-`KEY_F12`.

### Shadertoy Mode

In Shadertoy mode, bind keyboard to a channel and sample the texture manually:

```json
{
  "mode": "shadertoy",
  "Image": {
    "iChannel0": "keyboard"
  }
}
```

```glsl
const int KEY_W = 87;

float ReadKey(int keycode) {
    float x = (float(keycode) + 0.5) / 256.0;
    return texture(iChannel0, vec2(x, 0.25)).x;
}
```

### Keyboard Texture Layout

The keyboard texture is 256x3 pixels (one column per ASCII keycode):

| Row | Y coordinate | Contents |
|-----|-------------|----------|
| 0 | `0.25` | Current key state (1.0 = down, 0.0 = up) |
| 1 | `0.50` | Unused |
| 2 | `0.75` | Toggle state (flips 0/1 on each press) |

## Complete Example: Persistent Drawing

`config.json`:
```json
{
  "title": "Paint",
  "controls": true,
  "BufferA": {
    "iChannel0": "BufferA"
  },
  "Image": {
    "iChannel0": "BufferA"
  }
}
```

`bufferA.glsl`:
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 color = texture(iChannel0, uv).rgb;

    if (iMouse.z > 0.0) {
        float dist = length(fragCoord - iMouse.xy);
        if (dist < 20.0) {
            color = vec3(1.0, 0.5, 0.2);
        }
    }

    fragColor = vec4(color, 1.0);
}
```

`image.glsl`:
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = texture(iChannel0, uv);
}
```

Press **R** to reset and clear the canvas!

## Tips and Best Practices

### Performance

- **Minimize texture reads** - Each `texture()` call is expensive
- **Avoid complex math in tight loops** - Especially in nested loops

### Common Patterns

**Clear on Reset**:
```glsl
vec3 color = (iFrame < 2) ? vec3(0.0) : texture(iChannel0, uv).rgb;
```

**Accumulation**:
```glsl
vec3 previous = texture(iChannel0, uv).rgb;
vec3 current = computeNewSample();
vec3 accumulated = mix(previous, current, 1.0 / float(iFrame + 1));
```

## Next Steps

- Read the [Configuration Reference](configuration.md) for all available options
- Check out the example demos for inspiration
