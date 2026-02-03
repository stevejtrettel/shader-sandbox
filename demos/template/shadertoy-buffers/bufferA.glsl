void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    vec4 prev = texelFetch(iChannel0, ivec2(fragCoord), 0);

    // Animated pattern
    float t = iTime;
    vec3 col = 0.5 + 0.5 * cos(t + uv.xyx * 3.0 + vec3(0, 2, 4));

    // Trail effect - blend with previous frame
    col = mix(prev.rgb, col, 0.05);

    fragColor = vec4(col, 1.0);
}
