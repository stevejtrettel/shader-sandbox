// Drag Points — interactive Voronoi diagram
//
// Click to place seeds, drag to move them.
// Uses struct array: seeds[i].pos (vec2), seeds[i].color (vec3)

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float aspect = iResolution.x / iResolution.y;

    if (seeds_count == 0) {
        // Empty state — subtle grid
        vec3 bg = vec3(0.08);
        float gx = smoothstep(0.0, 0.002, abs(mod(uv.x * 16.0, 1.0) - 0.5) - 0.48);
        float gy = smoothstep(0.0, 0.002, abs(mod(uv.y * 16.0, 1.0) - 0.5) - 0.48);
        bg += vec3(0.03) * (1.0 - gx * gy);
        fragColor = vec4(bg, 1.0);
        return;
    }

    // Voronoi: find nearest and second-nearest
    float d1 = 1e10, d2 = 1e10;
    int nearest = 0;

    for (int i = 0; i < seeds_count; i++) {
        vec2 delta = uv - seeds[i].pos;
        delta.x *= aspect;
        float d = length(delta);
        if (d < d1) {
            d2 = d1; d1 = d;
            nearest = i;
        } else if (d < d2) {
            d2 = d;
        }
    }

    // Cell color
    vec3 col = seeds[nearest].color;

    // Edge darkening
    float edge = d2 - d1;
    float fw = fwidth(edge);
    float edgeMask = smoothstep(0.0, fw * uEdgeWidth, edge);
    col *= 0.3 + 0.7 * edgeMask;

    // Seed dot
    float dot = 1.0 - smoothstep(0.004, 0.007, d1);
    col = mix(col, vec3(1.0), dot * 0.8);

    fragColor = vec4(col, 1.0);
}
