// Uniform Controls Test Shader
// Demonstrates all uniform types: float, int, bool, vec2, vec3
// Custom uniforms are auto-declared from config.json

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord / iResolution.xy;

    // Apply offset from XY pad (center position)
    vec2 p = uv - uOffset;

    // Correct aspect ratio
    p.x *= iResolution.x / iResolution.y;

    // Apply scale
    p *= uScale;

    // Animate based on toggle
    float t = uAnimate ? iTime * uSpeed : 0.0;

    // Create ring pattern using int uniform
    float d = length(p);
    float rings = sin(d * float(uRings) * 2.0 - t) * 0.5 + 0.5;

    // Add some angular variation
    float angle = atan(p.y, p.x);
    float pattern = rings * (sin(angle * 4.0 + t * 0.5) * 0.3 + 0.7);

    // Apply the color from color picker
    vec3 col = uColor * pattern;

    // Add subtle glow at center
    col += uColor * 0.3 * exp(-d * 3.0);

    // Output to screen
    fragColor = vec4(col, 1.0);
}
