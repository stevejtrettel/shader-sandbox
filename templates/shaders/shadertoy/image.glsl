// Shadertoy-compatible shader
// Copy this shader directly from shadertoy.com and it will work!

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized coordinates (0 to 1)
    vec2 uv = fragCoord / iResolution.xy;

    // Time varying color
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));

    // Output to screen
    fragColor = vec4(col, 1.0);
}
