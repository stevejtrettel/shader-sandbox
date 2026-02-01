# Getting Started

Welcome! This guide will teach you how to write your first shader and understand the basics of shader programming.

## What is a Shader?

A shader is a program that runs on your graphics card (GPU) to determine what color each pixel on the screen should be. Instead of running once like a normal program, your shader runs **millions of times per frame** - once for every pixel!

Think of it like this: you write a function that says "if you give me an (x, y) coordinate, I'll tell you what color that pixel should be." The GPU calls your function for every pixel on the screen, many times per second.

## Your First Shader

Let's create a simple animated gradient!

### Step 1: Create Your Shader

```bash
shader new my-first-shader
```

### Step 2: Write Your Shader Code

Edit `shaders/my-first-shader/image.glsl`:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Convert pixel coordinates to 0-1 range
    vec2 uv = fragCoord / iResolution.xy;

    // Create a simple gradient
    vec3 color = vec3(uv.x, uv.y, 0.5);

    // Output the final color
    fragColor = vec4(color, 1.0);
}
```

### Step 3: Run It!

```bash
shader dev my-first-shader
```

Open `http://localhost:3000` in your browser. You should see a gradient!

🎉 **Congratulations!** You just wrote your first shader!

## Understanding the Code

Let's break down what each part does:

### The `mainImage()` Function

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord)
```

This is your shader's entry point. It gets called once for every pixel:
- `fragCoord` - The pixel coordinates (x, y) in pixels
- `fragColor` - The output color you set (red, green, blue, alpha)

### Converting to UV Coordinates

```glsl
vec2 uv = fragCoord / iResolution.xy;
```

`fragCoord` gives you pixel coordinates like (0, 0) to (1920, 1080). We usually want values from 0 to 1, so we divide by the screen resolution:
- `iResolution.xy` is the width and height of your canvas in pixels
- `uv` will be (0, 0) at bottom-left and (1, 1) at top-right

**Why "UV"?** In graphics programming, (u, v) are the standard names for 2D texture coordinates, just like (x, y, z) for 3D positions.

### Setting the Color

```glsl
vec3 color = vec3(uv.x, uv.y, 0.5);
fragColor = vec4(color, 1.0);
```

Colors in shaders are `vec4` with four components:
- **Red** (0.0 to 1.0)
- **Green** (0.0 to 1.0)
- **Blue** (0.0 to 1.0)
- **Alpha** (0.0 = transparent, 1.0 = opaque)

We create a `vec3` for RGB, then add alpha to make a `vec4`.

## Available Uniforms

"Uniforms" are special variables that the engine provides to your shader. They're the same for every pixel but change over time or based on user input.

### `iResolution`

The size of your canvas in pixels.

```glsl
vec3 iResolution  // .x = width, .y = height, .z = 1.0
```

**Example: Center a circle**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Get center of screen
    vec2 center = iResolution.xy * 0.5;

    // Distance from center
    float dist = length(fragCoord - center);

    // Draw circle with radius 100 pixels
    float circle = step(dist, 100.0);

    fragColor = vec4(vec3(circle), 1.0);
}
```

### `iTime`

The number of seconds since the shader started.

```glsl
float iTime
```

**Example: Pulsing animation**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Oscillate between 0 and 1
    float pulse = 0.5 + 0.5 * sin(iTime);

    vec3 color = vec3(uv.x, uv.y, pulse);
    fragColor = vec4(color, 1.0);
}
```

### `iTimeDelta`

The time in seconds since the last frame (useful for physics simulations).

```glsl
float iTimeDelta
```

### `iFrame`

The current frame number (starts at 0, increments by 1 each frame).

```glsl
int iFrame
```

**Example: Count frames**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Cycle colors every 60 frames
    float t = float(iFrame % 60) / 60.0;

    vec3 color = vec3(t, uv.x, uv.y);
    fragColor = vec4(color, 1.0);
}
```

### `iMouse`

Mouse position and click state.

```glsl
vec4 iMouse  // .xy = current pos, .zw = click pos (or negative if not clicked)
```

**Example: Follow the mouse**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Distance to mouse
    float dist = length(fragCoord - iMouse.xy);

    // Brighter near mouse
    float brightness = 1.0 - smoothstep(0.0, 200.0, dist);

    fragColor = vec4(vec3(brightness), 1.0);
}
```

### Touch Uniforms (Mobile / Multi-touch)

On mobile devices (or any touch-enabled screen), the engine provides additional uniforms for multi-touch and gesture input.

```glsl
int iTouchCount        // Number of active touches (0-3)
vec4 iTouch0           // First touch: xy = current pos, zw = start pos
vec4 iTouch1           // Second touch
vec4 iTouch2           // Third touch
float iPinch           // Pinch scale (1.0 = no pinch, >1 = spread, <1 = squeeze)
float iPinchDelta      // Change in pinch scale this frame
vec2 iPinchCenter      // Center point between two pinch fingers
```

A single touch also updates `iMouse` for compatibility with mouse-based shaders.

**Example: Pinch to zoom**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Zoom from center based on pinch gesture
    vec2 center = vec2(0.5);
    uv = (uv - center) / iPinch + center;

    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
    fragColor = vec4(col, 1.0);
}
```

**Example: Draw at touch points**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float brightness = 0.0;

    // Draw circles at each active touch
    if (iTouchCount >= 1) {
        brightness += smoothstep(50.0, 0.0, length(fragCoord - iTouch0.xy));
    }
    if (iTouchCount >= 2) {
        brightness += smoothstep(50.0, 0.0, length(fragCoord - iTouch1.xy));
    }

    fragColor = vec4(vec3(brightness), 1.0);
}
```

## Common Patterns

### Drawing a Circle

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Center coordinates (-0.5 to 0.5)
    vec2 centered = uv - 0.5;

    // Make it aspect-ratio correct
    centered.x *= iResolution.x / iResolution.y;

    // Distance from center
    float dist = length(centered);

    // Sharp circle at radius 0.2
    float circle = step(dist, 0.2);

    fragColor = vec4(vec3(circle), 1.0);
}
```

### Smooth Gradients

Use `smoothstep()` instead of `step()` for smooth transitions:

```glsl
// Sharp edge
float sharp = step(0.5, uv.x);

// Smooth edge
float smooth = smoothstep(0.4, 0.6, uv.x);
```

### Animated Rotation

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy - 0.5;
    uv.x *= iResolution.x / iResolution.y;

    // Rotate UV coordinates
    float angle = iTime;
    mat2 rot = mat2(cos(angle), -sin(angle),
                    sin(angle), cos(angle));
    uv = rot * uv;

    // Create a pattern
    vec3 color = vec3(uv.x + 0.5, uv.y + 0.5, 0.5);
    fragColor = vec4(color, 1.0);
}
```

## Understanding Coordinate Systems

Shaders use a different coordinate system than you might expect:

### Pixel Coordinates (`fragCoord`)
- Origin (0, 0) is at **bottom-left**
- Y increases upward
- Values in pixels: (0, 0) to (width, height)

### UV Coordinates (normalized)
- Created by dividing by `iResolution.xy`
- Range from (0, 0) to (1, 1)
- Origin still at bottom-left

### Centered Coordinates
- Common pattern: `uv - 0.5` centers the origin
- Range from (-0.5, -0.5) to (0.5, 0.5)
- Good for circles and symmetric patterns

### Aspect Ratio Correction

To prevent stretching on non-square canvases:

```glsl
vec2 uv = fragCoord / iResolution.xy - 0.5;
uv.x *= iResolution.x / iResolution.y;  // Correct aspect ratio
```

## Using the Viewer Controls

### Always Available
- **S key** - Save a screenshot as PNG

### When `controls: true` in config
- **Space** - Play/Pause animation
- **R** - Reset (restart from frame 0)
- **Camera button** - Take screenshot
- **Play/Pause button** - Toggle animation
- **Reset button** - Restart shader

## Next Steps

Now that you understand the basics, you're ready to:

1. **Experiment** - Try changing the examples above
2. **Learn multi-pass rendering** - See [Buffers and Channels](buffers-and-channels.md)
3. **Configure your shader** - See [Configuration](configuration.md)

## Quick Reference

### Data Types
```glsl
float x = 1.0;           // Single number
vec2 v = vec2(1.0, 2.0); // 2D vector
vec3 c = vec3(1.0);      // 3D vector (all components same)
vec4 rgba = vec4(c, 1.0); // 4D vector (RGB + alpha)
```

### Common Functions
```glsl
length(v)              // Length of vector
distance(a, b)         // Distance between points
dot(a, b)              // Dot product
normalize(v)           // Make vector length 1
mix(a, b, t)          // Linear interpolation
smoothstep(a, b, x)   // Smooth 0-1 transition
clamp(x, min, max)    // Constrain value
sin(x), cos(x)        // Trigonometry
abs(x), sign(x)       // Absolute value, sign
floor(x), ceil(x)     // Rounding
mod(x, y)             // Modulo
```

Happy shader coding! 🎨
