# Troubleshooting

Common issues and how to solve them.

## Shader Compilation Errors

### Symptom: Red error overlay on screen

The shader failed to compile. Error overlay shows:
- Pass name where error occurred
- Error message from WebGL
- Line number (if available)
- Full shader source with line numbers

### Common Causes

#### 1. Syntax Error in GLSL

**Error**:
```
ERROR: 0:42: ';' : syntax error
```

**Cause**: Missing semicolon, mismatched braces, typo in function name.

**Solution**: Check the indicated line number. Remember that line numbers include injected code (version directive, common.glsl, etc.), so the error might not be exactly where you think.

**Debugging tip**: Look at the full source in the error overlay to see the exact preprocessed code.

#### 2. Undefined Variable

**Error**:
```
ERROR: 0:15: 'uv' : undeclared identifier
```

**Cause**: Used a variable before declaring it.

**Solution**: Declare the variable:
```glsl
vec2 uv = fragCoord / iResolution.xy;
```

#### 3. Type Mismatch

**Error**:
```
ERROR: 0:20: '=' : cannot convert from 'float' to 'vec3'
```

**Cause**: Trying to assign incompatible types.

**Solution**: Make types match:
```glsl
// Wrong
vec3 color = 0.5;

// Right
vec3 color = vec3(0.5);
```

#### 4. Function Not Found

**Error**:
```
ERROR: 0:25: 'myFunction' : no matching overloaded function found
```

**Cause**: Function not defined, or wrong argument types.

**Solution**:
- Define the function above where you use it
- Put shared functions in `common.glsl`
- Check argument types match

#### 5. Wrong GLSL Version

**Error**:
```
ERROR: 0:1: '' : version 300 es required
```

**Cause**: Using GLSL ES 3.0 features without version directive.

**Solution**: The preprocessor automatically adds `#version 300 es`, so this shouldn't happen. If it does, check you're not manually adding an older version.

### Advanced: Reading Line Numbers

The error overlay shows line numbers **including injected code**:

```
1: #version 300 es
2: precision highp float;
3:
4: // common.glsl content here (if exists)
...
42: YOUR CODE HERE  ← Error on this line
```

To find your actual line, count from where your code starts after common.glsl.

---

## Configuration Errors

### "Image pass is required"

**Error in console**:
```
Error: Image pass is required but not found in config
```

**Cause**: Config doesn't define an Image pass.

**Solution**: Always include an `image.glsl` file. The Image pass is always required.

### "Buffer 'BufferX' not found"

**Error in console**:
```
Error: Buffer 'BufferA' not found
```

**Cause**: A pass references a buffer that doesn't exist in the config.

**Example**:
```json
{
  "Image": {
    "iChannel0": "BufferA"
  }
}
```
But there's no `bufferA.glsl` or BufferA pass defined.

**Solution**: Add the missing buffer pass and shader file:
```json
{
  "BufferA": {},
  "Image": {
    "iChannel0": "BufferA"
  }
}
```

### "Texture not found: photo.jpg"

**Error in console**:
```
Error: Failed to load texture: photo.jpg
```

**Cause**: Texture file doesn't exist or path is wrong.

**Solution**:
1. Check file exists in demo folder
2. Check filename matches exactly (case-sensitive!)
3. Use just the filename, no path: `"photo.jpg"` not `"./photo.jpg"`

**Example structure**:
```
shaders/my-shader/
├── config.json
├── image.glsl
└── photo.jpg  ← Must be here
```

### Invalid JSON

**Error in console**:
```
SyntaxError: Unexpected token } in JSON at position 42
```

**Cause**: Malformed JSON (extra comma, missing quote, etc.).

**Common mistakes**:
```json
{
  "passes": {
    "Image": {},  ← Extra comma here (last item shouldn't have comma)
  }
}
```

**Solution**: Use a JSON validator or editor with JSON support.

---

## Runtime Errors

### Black Screen

**Symptom**: Canvas is completely black, no errors shown.

**Possible Causes**:

#### 1. Shader outputs zero

Your shader is working, but outputting black:
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  vec3 color = vec3(0.0);  // Always black!
  fragColor = vec4(color, 1.0);
}
```

**Solution**: Actually compute something:
```glsl
vec3 color = vec3(uv, 0.5);  // Gradient
```

#### 2. Canvas size is 0×0

Container element has no size.

**Solution**: Make sure container has dimensions:
```css
#app {
  width: 100vw;
  height: 100vh;
}
```

#### 3. WebGL context not created

**Check console for**: "WebGL2 not supported"

**Solution**: Use a modern browser (Chrome, Firefox, Edge, Safari 15+).

### Screenshot is Black

**Symptom**: Pressing S saves a black PNG.

**Cause**: `preserveDrawingBuffer` was disabled (but it should be enabled).

**Solution**: Check `src/app/App.ts`:
```typescript
const gl = this.canvas.getContext('webgl2', {
  preserveDrawingBuffer: true,  // Must be true!
  // ...
});
```

This is already fixed in the codebase, but if you modified it, ensure this is `true`.

### Choppy Animation

**Symptom**: FPS drops below 60, animation stutters.

**Possible Causes**:

#### 1. Shader too expensive

Each pixel runs your shader code. Complex math × high resolution = slow.

**Solution**:
- Simplify shader logic
- Reduce canvas resolution
- Profile using browser DevTools Performance tab

#### 2. Too many texture reads

Each `texture()` call is expensive.

**Bad**:
```glsl
for (int i = 0; i < 100; i++) {
  color += texture(iChannel0, uv + offset * float(i)).rgb;
}
```

**Better**:
```glsl
// Use fewer, smarter samples
for (int i = 0; i < 10; i++) {
  color += texture(iChannel0, uv + offset * float(i)).rgb;
}
```

#### 3. High resolution

4K resolution = 4× more pixels than 1080p.

**Solution**:
- Test at lower resolution first
- Set `pixelRatio: 1` in App options for performance
- Use smaller buffer resolutions (future feature)

### Memory Issues

**Symptom**: Browser tab crashes or becomes unresponsive.

**Cause**: Too much VRAM usage.

**Calculation**:
- 1920×1080 @ RGBA32F = ~33 MB per texture
- Each pass has 2 textures (ping-pong) = ~66 MB
- 5 passes = ~330 MB
- Plus external textures

At 4K: ~1.3 GB for passes alone!

**Solution**:
- Reduce resolution
- Use fewer passes
- Close other tabs/applications

---

## Build Errors

### TypeScript Compilation Errors

**Error**:
```
src/app/App.ts:42:5 - error TS2322: Type 'number' is not assignable to type 'string'.
```

**Cause**: Type mismatch in TypeScript code.

**Solution**: Fix the type error. TypeScript is preventing a bug!

### Vite Build Fails

**Error**:
```
✘ [ERROR] Could not resolve "prismjs"
```

**Cause**: Missing dependency.

**Solution**:
```bash
npm install
```

### Import Not Found

**Error**:
```
Module '"./types"' has no exported member 'SomeType'
```

**Cause**: Trying to import something that doesn't exist.

**Solution**:
1. Check the export exists in the file
2. Check spelling and capitalization
3. Make sure file was saved

---

## Performance Debugging

### Identifying Slow Passes

Currently no per-pass timing. Future improvement: GPU timer queries.

**Manual approach**:
1. Comment out passes one by one
2. Check FPS after each
3. Find the culprit

### Profiling Shader Code

**Browser DevTools**:
1. Open Performance tab
2. Click Record
3. Let shader run for a few seconds
4. Stop recording
5. Look for long frames

### Common Performance Killers

**Expensive operations** (slowest to fastest):
1. `texture()` reads (especially with many samples)
2. Loops with many iterations
3. Trigonometry (`sin`, `cos`, `atan`)
4. Exponentials (`exp`, `pow`)
5. Division
6. Multiplication
7. Addition

**Optimization tips**:
- Move constant calculations outside loops
- Use `const` for loop bounds
- Avoid dynamic array indexing
- Use cheaper approximations when possible
- Sample textures at lower LOD levels

---

## Browser Compatibility

### WebGL 2 Support

**Required**: WebGL 2 (OpenGL ES 3.0)

**Supported browsers**:
- Chrome 56+ (2017)
- Firefox 51+ (2017)
- Safari 15+ (2021)
- Edge 79+ (2020)

**Not supported**:
- Internet Explorer (any version)
- Old Safari (pre-15)

### Checking WebGL Support

Visit: https://get.webgl.org/webgl2/

### Float Texture Support

**Required extension**: `EXT_color_buffer_float`

**What it enables**: Rendering to RGBA32F textures (needed for accumulation, physics, etc.)

**Support**: All modern browsers with WebGL 2

If this fails, you'll see:
```
Error: EXT_color_buffer_float not supported
```

**Solution**: Update your browser or graphics drivers.

---

## Development Issues

### Hot Reload Not Working

**Symptom**: Changes to files don't update in browser.

**Solution**:
1. Check dev server is running (`shader dev <name>`)
2. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
3. Check console for errors

### GLSL Changes Not Updating

**Symptom**: Editing `.glsl` files doesn't reload shader.

**Cause**: GLSL files are loaded dynamically, not watched by Vite HMR.

**Solution**: Refresh the page manually after GLSL changes.

**Future improvement**: Add file watcher for `.glsl` files.

### TypeScript Errors in Editor

**Symptom**: VSCode shows red squiggles but code works.

**Cause**: TypeScript server out of sync.

**Solution**:
1. Restart TypeScript server: Cmd+Shift+P → "Restart TS Server"
2. Check `tsconfig.json` is correct
3. Run `npm run build` to check for real errors

---

## Demo Loading Issues

### "Demo not found"

**Error in console**:
```
Error: Demo 'my-shader' not found
```

**Cause**: Folder doesn't exist or demo name is wrong.

**Solution**:
1. Check folder exists: `shaders/my-shader/`
2. Check spelling matches exactly
3. Check command has correct name:
```bash
shader dev my-shader  # Must match folder name
```

### "No image.glsl found"

**Error in console**:
```
Error: image.glsl not found for demo 'my-shader'
```

**Cause**: Missing `image.glsl` file.

**Solution**: Every demo must have an Image pass. Either:
- Create `image.glsl` (simple demos)
- Create `config.json` with Image pass definition

---

## Common Pitfalls

### 1. Forgetting to Reset

**Issue**: Accumulation shader shows garbage after changing code.

**Solution**: Press **R** to reset, or enable `controls: true` for reset button.

### 2. UV Coordinates Wrong

**Issue**: Shader looks stretched or flipped.

**Cause**: Not handling aspect ratio.

**Solution**:
```glsl
vec2 uv = fragCoord / iResolution.xy - 0.5;
uv.x *= iResolution.x / iResolution.y;  // Fix aspect ratio
```

### 3. Reading Wrong Channel

**Issue**: Texture shows up in wrong channel.

**Cause**: Channel indices don't match config.

**Example**:
```json
"iChannel1": { "texture": "photo.jpg" }  // Bound to channel 1
```

```glsl
vec3 tex = texture(iChannel0, uv).rgb;  // Reading channel 0 (wrong!)
```

**Solution**: Use the correct channel index.

### 4. Ping-Pong Not Working

**Issue**: Self-referencing buffer shows black or doesn't update correctly.

**Cause**: The buffer isn't referencing itself in config.

**Correct** (self-reference is auto-detected):
```json
{
  "BufferA": {
    "iChannel0": "BufferA"
  }
}
```

When BufferA references itself, the engine automatically uses the previous frame's output via ping-pong textures.

### 5. Keyboard Not Working

**Issue**: Key presses don't affect shader.

**Possible causes**:

**A. Keyboard channel not bound**:

In Shadertoy mode:
```json
{
  "Image": {
    "iChannel0": "keyboard"
  }
}
```

In standard mode:
```json
{
  "textures": {
    "keyboard": "keyboard"
  }
}
```

**B. Using standard mode helpers in Shadertoy mode**:

The `keyDown()`, `isKeyDown()`, etc. helpers are only auto-injected in standard mode. In Shadertoy mode you must sample the texture manually.

**C. Wrong sample coordinates** (Shadertoy mode):
```glsl
// Correct:
texture(iChannel0, vec2((float(keycode) + 0.5) / 256.0, 0.25))

// Wrong:
texture(iChannel0, uv)  // Random position, not keycode!
```

---

## Getting Help

If you're stuck:

1. **Check console** - Errors appear there first
2. **Check this guide** - Most issues are covered above
3. **Read the docs** - Architecture and component docs explain how things work
4. **Simplify** - Remove code until it works, then add back piece by piece
5. **Compare with demos** - Look at working examples

### Reporting Bugs

If you find a real bug in the engine:

1. Check it's not in your shader code
2. Create a minimal reproduction
3. Check browser console for errors
4. Note your browser/OS version
5. Open an issue with details

### Debug Mode

Add logging to understand what's happening:

```typescript
// In engine code
console.log('Binding channel', channelIndex, 'to', source);

// In shader code (can't console.log, but can output to screen)
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  // Output debug values as colors
  fragColor = vec4(vec3(iFrame / 100.0), 1.0);  // Shows frame count as brightness
}
```

---

## Summary

Most issues fall into these categories:
- **GLSL syntax errors** - Check error overlay, fix shader code
- **Configuration errors** - Validate JSON, check references
- **Performance issues** - Simplify shader, reduce resolution
- **Browser compatibility** - Use modern browser with WebGL 2

When in doubt, start with the simplest possible shader and build up complexity incrementally. This makes it easier to isolate problems.

Happy debugging! 🐛
