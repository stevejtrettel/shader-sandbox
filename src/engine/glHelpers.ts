/**
 * Engine Layer - WebGL Helper Functions
 *
 * Low-level WebGL utilities for shader compilation, texture creation,
 * framebuffer management, and VAO setup.
 *
 * Based on docs/engine-spec.md
 */

// =============================================================================
// Shader Compilation
// =============================================================================

/**
 * Compile a shader of given type from source. Throws on error.
 */
export function createShader(
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create shader object');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    const infoLog = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed:\n${infoLog}`);
  }

  return shader;
}

/**
 * Link a program from vertex + fragment source strings.
 * Throws with a descriptive error if link fails.
 */
export function createProgramFromSources(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  const program = gl.createProgram();
  if (!program) {
    throw new Error('Failed to create program object');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    const infoLog = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error(`Program linking failed:\n${infoLog}`);
  }

  // Clean up shaders (no longer needed after linking)
  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

// =============================================================================
// Fullscreen Triangle VAO
// =============================================================================

/**
 * Create a full-screen triangle VAO.
 *
 * Attribute layout:
 *  - location 0: vec2 position in clip space.
 *
 * The triangle covers the entire screen using three vertices:
 * (-1, -1), (3, -1), (-1, 3)
 * This ensures all pixels are covered without needing two triangles.
 */
export function createFullscreenTriangleVAO(gl: WebGL2RenderingContext): WebGLVertexArrayObject {
  const vao = gl.createVertexArray();
  if (!vao) {
    throw new Error('Failed to create VAO');
  }

  gl.bindVertexArray(vao);

  // Create VBO with triangle vertices
  const positions = new Float32Array([
    -1, -1,  // Bottom-left
     3, -1,  // Bottom-right (extends beyond viewport)
    -1,  3,  // Top-left (extends beyond viewport)
  ]);

  const vbo = gl.createBuffer();
  if (!vbo) {
    throw new Error('Failed to create VBO');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  // Enable and configure vertex attribute at location 0
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(
    0,        // attribute location
    2,        // size (vec2)
    gl.FLOAT, // type
    false,    // normalized
    0,        // stride
    0         // offset
  );

  // Unbind
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return vao;
}

// =============================================================================
// Texture Creation
// =============================================================================

/**
 * Create a float RGBA texture (no data) for use as a render target.
 * This MUST use an internal format compatible with EXT_color_buffer_float.
 *
 * Per spec: ALL render targets MUST be RGBA32F.
 */
export function createRenderTargetTexture(
  gl: WebGL2RenderingContext,
  width: number,
  height: number
): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) {
    throw new Error('Failed to create texture');
  }

  gl.bindTexture(gl.TEXTURE_2D, tex);

  // Allocate RGBA32F texture (float format required by Shadertoy spec)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,                // mip level
    gl.RGBA32F,       // internal format (32-bit float per channel)
    width,
    height,
    0,                // border (must be 0)
    gl.RGBA,          // format
    gl.FLOAT,         // type
    null              // no data (allocate only)
  );

  // Set filtering to NEAREST (common for simulation/compute shaders)
  // This prevents interpolation artifacts in PDE/physics shaders
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Set wrap mode to CLAMP_TO_EDGE (prevent wrap-around at boundaries)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindTexture(gl.TEXTURE_2D, null);

  return tex;
}

/**
 * Create a framebuffer with a single color attachment at COLOR_ATTACHMENT0.
 * Throws if framebuffer is not complete.
 */
export function createFramebufferWithColorAttachment(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture
): WebGLFramebuffer {
  const fbo = gl.createFramebuffer();
  if (!fbo) {
    throw new Error('Failed to create framebuffer');
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

  // Attach texture to color attachment 0
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0  // mip level
  );

  // Check framebuffer completeness
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(fbo);
    throw new Error(`Framebuffer incomplete: ${getFramebufferStatusString(gl, status)}`);
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return fbo;
}

/**
 * Create a 1x1 black float texture for unused channels.
 *
 * Per spec: UNUSED CHANNELS MUST STILL BIND A 1×1 BLACK FLOAT TEXTURE.
 * This prevents NaN/undefined behavior when sampling unused channels.
 */
export function createBlackTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) {
    throw new Error('Failed to create black texture');
  }

  gl.bindTexture(gl.TEXTURE_2D, tex);

  // 1x1 black pixel [0, 0, 0, 1] as float
  const blackPixel = new Float32Array([0, 0, 0, 1]);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA32F,
    1,
    1,
    0,
    gl.RGBA,
    gl.FLOAT,
    blackPixel
  );

  // Set filtering
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Set wrap mode
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindTexture(gl.TEXTURE_2D, null);

  return tex;
}

/**
 * Create a 256x3 keyboard state texture.
 *
 * Shadertoy keyboard texture format:
 * - Width: 256 (one column per ASCII keycode)
 * - Height: 3 (3 rows for different data)
 * - Row 0 (sample at y=0.25): Current key state (0.0 = up, 1.0 = down)
 * - Row 1: Unused
 * - Row 2 (sample at y=0.75): Toggle state (flips between 0.0 and 1.0 on each press)
 *
 * Returns the WebGLTexture. Data is initialized to all zeros.
 * Use updateKeyboardTexture() to update the state.
 */
export function createKeyboardTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) {
    throw new Error('Failed to create keyboard texture');
  }

  gl.bindTexture(gl.TEXTURE_2D, tex);

  // 256x3 texture, all zeros initially
  const width = 256;
  const height = 3;
  const data = new Float32Array(width * height * 4); // RGBA, all zeros

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA32F,
    width,
    height,
    0,
    gl.RGBA,
    gl.FLOAT,
    data
  );

  // NEAREST filtering - no interpolation between keys!
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // CLAMP to edge
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindTexture(gl.TEXTURE_2D, null);

  return tex;
}

/**
 * Update keyboard texture with current key states.
 *
 * @param gl WebGL context
 * @param texture The keyboard texture to update
 * @param keyStates Map of keycode -> current state (true = down, false = up)
 * @param toggleStates Map of keycode -> toggle state (0.0 or 1.0)
 */
export function updateKeyboardTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  keyStates: Map<number, boolean>,
  toggleStates: Map<number, number>
): void {
  const width = 256;
  const height = 3;
  const data = new Float32Array(width * height * 4);

  // Fill in key states
  for (let keycode = 0; keycode < 256; keycode++) {
    const isDown = keyStates.get(keycode) || false;
    const toggleValue = toggleStates.get(keycode) || 0.0;

    // Row 0 (y=0): Current key state
    const row0Index = (0 * width + keycode) * 4;
    data[row0Index + 0] = isDown ? 1.0 : 0.0; // R channel
    data[row0Index + 1] = isDown ? 1.0 : 0.0; // G channel (redundant but matches Shadertoy)
    data[row0Index + 2] = isDown ? 1.0 : 0.0; // B channel
    data[row0Index + 3] = 1.0; // A channel

    // Row 1 (y=1): Unused (keep as zeros)

    // Row 2 (y=2): Toggle state
    const row2Index = (2 * width + keycode) * 4;
    data[row2Index + 0] = toggleValue;
    data[row2Index + 1] = toggleValue;
    data[row2Index + 2] = toggleValue;
    data[row2Index + 3] = 1.0;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,
    0, 0, // x, y offset
    width, height,
    gl.RGBA,
    gl.FLOAT,
    data
  );
  gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * Create a 2D texture from an HTMLImageElement (or ImageBitmap).
 * This is used for project textures (dog.png, noise.png, etc.)
 *
 * NOTE: actual image loading is done by the App; engine just gets an
 * already-loaded image object.
 */
export function createTextureFromImage(
  gl: WebGL2RenderingContext,
  image: HTMLImageElement | ImageBitmap,
  filter: 'nearest' | 'linear',
  wrap: 'clamp' | 'repeat'
): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) {
    throw new Error('Failed to create texture');
  }

  gl.bindTexture(gl.TEXTURE_2D, tex);

  // Upload image data
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );

  // Set filtering
  const glFilter = filter === 'nearest' ? gl.NEAREST : gl.LINEAR;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, glFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, glFilter);

  // Set wrap mode
  const glWrap = wrap === 'clamp' ? gl.CLAMP_TO_EDGE : gl.REPEAT;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, glWrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, glWrap);

  gl.bindTexture(gl.TEXTURE_2D, null);

  return tex;
}

// =============================================================================
// Audio Texture
// =============================================================================

/**
 * Create a 512x2 audio texture (Shadertoy-compatible).
 * Row 0: frequency spectrum (FFT), Row 1: waveform.
 * Uses R8 format — data is in the red channel, sampled with texture().x
 */
export function createAudioTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error('Failed to create audio texture');

  gl.bindTexture(gl.TEXTURE_2D, tex);

  const width = 512;
  const height = 2;
  const data = new Uint8Array(width * height); // R8, all zeros

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, width, height, 0, gl.RED, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return tex;
}

/**
 * Update audio texture with frequency and waveform data.
 */
export function updateAudioTextureData(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  frequencyData: Uint8Array,
  waveformData: Uint8Array,
): void {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Row 0: frequency
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 512, 1, gl.RED, gl.UNSIGNED_BYTE, frequencyData);
  // Row 1: waveform
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 1, 512, 1, gl.RED, gl.UNSIGNED_BYTE, waveformData);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

// =============================================================================
// Video/Webcam Texture
// =============================================================================

/**
 * Create a placeholder texture for video/webcam (1x1 black, RGBA).
 * Updated each frame with actual video data once ready.
 */
export function createVideoPlaceholderTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error('Failed to create video texture');

  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return tex;
}

/**
 * Upload a video frame to a texture.
 */
export function updateVideoTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  video: HTMLVideoElement,
): void {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

// =============================================================================
// Script-Uploaded Texture
// =============================================================================

/**
 * Create or update a script-uploaded texture.
 * Detects data type: Uint8Array → RGBA8, Float32Array → RGBA32F.
 */
export function createOrUpdateScriptTexture(
  gl: WebGL2RenderingContext,
  existing: WebGLTexture | null,
  width: number,
  height: number,
  data: Uint8Array | Float32Array,
): WebGLTexture {
  const tex = existing ?? gl.createTexture();
  if (!tex) throw new Error('Failed to create script texture');

  gl.bindTexture(gl.TEXTURE_2D, tex);

  if (data instanceof Float32Array) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, data);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return tex;
}

// =============================================================================
// Helper Utilities
// =============================================================================

/**
 * Get a human-readable string for framebuffer status.
 */
function getFramebufferStatusString(gl: WebGL2RenderingContext, status: GLenum): string {
  switch (status) {
    case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
      return 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT';
    case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
      return 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT';
    case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
      return 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS';
    case gl.FRAMEBUFFER_UNSUPPORTED:
      return 'FRAMEBUFFER_UNSUPPORTED';
    case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
      return 'FRAMEBUFFER_INCOMPLETE_MULTISAMPLE';
    default:
      return `Unknown status: ${status}`;
  }
}
