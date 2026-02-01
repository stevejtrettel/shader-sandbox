// Live Editor Demo
// Try editing these values and pressing Ctrl+Enter (or click Recompile)!

// === EDIT THESE VALUES ===
#define NUM_RINGS 8.0       // Try: 4.0, 12.0, 20.0
#define RING_SPEED 2.0      // Try: 0.5, 4.0, -2.0
#define COLOR_SPEED 1.0     // Try: 0.0, 3.0, 0.5
#define RING_WIDTH 0.4      // Try: 0.1, 0.5, 0.8

// Color palette - try changing these!
vec3 color1 = vec3(0.2, 0.5, 0.9);  // Blue
vec3 color2 = vec3(0.9, 0.3, 0.5);  // Pink
vec3 color3 = vec3(0.1, 0.8, 0.6);  // Teal

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized coordinates centered at screen middle
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    // Distance from center
    float dist = length(uv);

    // Create expanding rings
    float rings = sin(dist * NUM_RINGS * 3.14159 - iTime * RING_SPEED);
    rings = smoothstep(-RING_WIDTH, RING_WIDTH, rings);

    // Animate color mixing
    float t = iTime * COLOR_SPEED;
    vec3 col = mix(color1, color2, rings);
    col = mix(col, color3, 0.5 + 0.5 * sin(t + dist * 4.0));

    // Add subtle glow at center
    col += 0.1 / (dist + 0.1);

    fragColor = vec4(col, 1.0);
}
