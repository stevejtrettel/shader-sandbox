void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 dx = 1.0 / iResolution.xy;

    // Initialize: B = 1 in a small center patch
    if (iFrame == 0) {
        float b = 0.0;
        vec2 center = abs(uv - 0.5);
        if (center.x < 0.05 && center.y < 0.05) {
            b = 0.25;
        }
        fragColor = vec4(b, 0.0, 0.0, 1.0);
        return;
    }

    float a = texture(field_a, uv).r;
    float b = texture(field_b, uv).r;

    // Gray-Scott: dB/dt = Db * lap(B) + A*B^2 - (f+k)*B
    float kill = uKill;
    float feed = uFeed;
    float lapB = lap(field_b, uv, dx);
    float newB = b + (0.5 * lapB + a * b * b - (feed + kill) * b);

    // Add chemical B at mouse position
    if (iMousePressed) {
        vec2 mouse = iMouse.xy / iResolution.xy;
        float d = length(uv - mouse);
        newB += 0.2 * smoothstep(0.02, 0.0, d);
    }

    fragColor = vec4(clamp(newB, 0.0, 1.0), 0.0, 0.0, 1.0);
}
