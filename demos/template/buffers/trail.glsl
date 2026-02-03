void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;

    // Read previous frame from named buffer
    vec4 prev = texture(trail, uv);

    // Animated pattern with custom color
    float t = iTime * 0.3;
    float pattern = sin(uv.x * 10.0 - t) * cos(uv.y * 10.0 + t);
    vec3 col = uColor * (0.5 + 0.3 * pattern);

    // Add interaction with mouse
    vec2 mouse = iMouse.xy / iResolution.xy;
    float dist = length(uv - mouse);
    col += uGlow * exp(-dist * 20.0);

    // Trail effect - blend with previous frame
    col = mix(prev.rgb, col, 0.02);

    fragColor = vec4(col, 1.0);
}
