// UBO Animated Test — 32 orbiting particles driven by JS each frame
// positions[i] = vec4(x, y, radius, hue) — auto-injected by engine

vec3 hueToRGB(float h) {
    return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float aspect = iResolution.x / iResolution.y;

    vec3 col = vec3(0.02);

    for (int i = 0; i < positions_count; i++) {
        vec4 p = positions[i];
        vec2 center = p.xy;
        float radius = p.z;
        float hue = p.w;

        // Aspect-correct distance
        vec2 diff = uv - center;
        diff.x *= aspect;
        float d = length(diff);

        // Soft circle with glow
        float brightness = smoothstep(radius, radius * 0.3, d);
        brightness += 0.02 / (d + 0.01); // glow

        col += hueToRGB(hue) * brightness * 0.15;
    }

    // Tone map
    col = col / (col + 1.0);

    fragColor = vec4(col, 1.0);
}
