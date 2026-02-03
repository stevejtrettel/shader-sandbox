void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;

    // Apply offset to UV coordinates
    vec2 p = uv + uOffset;

    // Animated gradient pattern
    float t = iTime * 0.5;
    vec3 col = 0.5 + 0.5 * cos(t + p.xyx * uScale * 0.3 + vec3(0, 2, 4));

    fragColor = vec4(col, 1.0);
}
