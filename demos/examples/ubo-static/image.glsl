// Static starfield — 64 stars set once from JS, twinkling in shader
// stars[i] = vec4(x, y, radius, brightness)

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float aspect = iResolution.x / iResolution.y;

    vec3 col = vec3(0.01, 0.01, 0.02);

    for (int i = 0; i < stars_count; i++) {
        vec4 s = stars[i];
        vec2 diff = uv - s.xy;
        diff.x *= aspect;
        float d = length(diff);

        // Twinkle using time + per-star phase
        float twinkle = 0.6 + 0.4 * sin(iTime * (2.0 + s.w * 8.0) + float(i) * 1.7);
        float glow = s.z / (d + 0.001) * s.w * twinkle;

        col += vec3(0.8, 0.85, 1.0) * glow * 0.015;
    }

    col = col / (col + 1.0);
    fragColor = vec4(col, 1.0);
}
