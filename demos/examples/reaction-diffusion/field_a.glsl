void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 dx = 1.0 / iResolution.xy;

    // Initialize: A = 1 everywhere, with a seed patch of B in the center
    if (iFrame == 0) {
        float a = 1.0;
        vec2 center = abs(uv - 0.5);
        if (center.x < 0.05 && center.y < 0.05) {
            a = 0.5;
        }
        fragColor = vec4(a, 0.0, 0.0, 1.0);
        return;
    }

    float a = texture(field_a, uv).r;
    float b = texture(field_b, uv).r;

    // Gray-Scott: dA/dt = Da * lap(A) - A*B^2 + f*(1-A)
    float feed = uFeed;
    float lapA = lap(field_a, uv, dx);
    float newA = a + (1.0 * lapA - a * b * b + feed * (1.0 - a));

    fragColor = vec4(clamp(newA, 0.0, 1.0), 0.0, 0.0, 1.0);
}
