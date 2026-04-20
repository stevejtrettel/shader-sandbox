// Click to Place — renders a growing Voronoi-like pattern from clicked points

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float aspect = iResolution.x / iResolution.y;

    if (points_count == 0) {
        // No points yet — show instruction
        vec3 bg = vec3(0.06);
        float grid = smoothstep(0.0, 0.002, abs(mod(uv.x * 20.0, 1.0) - 0.5) - 0.48);
        grid *= smoothstep(0.0, 0.002, abs(mod(uv.y * 20.0, 1.0) - 0.5) - 0.48);
        bg += vec3(0.03) * (1.0 - grid);
        fragColor = vec4(bg, 1.0);
        return;
    }

    // Find nearest point
    float minDist = 1e10;
    int nearest = 0;
    for (int i = 0; i < points_count; i++) {
        vec2 d = uv - points[i];
        d.x *= aspect;
        float dist = length(d);
        if (dist < minDist) {
            minDist = dist;
            nearest = i;
        }
    }

    // Color by nearest point index
    float hue = float(nearest) * 137.508; // golden angle
    vec3 col = 0.55 + 0.45 * cos(6.2832 * (hue / 360.0) + vec3(0.0, 2.0, 4.0));

    // Edge darkening
    float edge = smoothstep(0.0, uRadius * uSoftness, minDist);
    col *= 0.4 + 0.6 * edge;

    // Dot at each point
    for (int i = 0; i < points_count; i++) {
        vec2 d = uv - points[i];
        d.x *= aspect;
        float dist = length(d);
        float dot = 1.0 - smoothstep(0.003, 0.006, dist);
        col = mix(col, vec3(1.0), dot);
    }

    fragColor = vec4(col, 1.0);
}
