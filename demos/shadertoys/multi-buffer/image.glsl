// Image: Composite all three buffers

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Sample all three buffers
    vec3 bufA = texture(iChannel0, uv).rgb;
    vec3 bufB = texture(iChannel1, uv).rgb;
    vec3 bufC = texture(iChannel2, uv).rgb;

    // Composite them together
    vec3 col = bufA + bufB + bufC;

    fragColor = vec4(col, 1.0);
}
