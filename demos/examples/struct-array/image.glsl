// Struct Array Demo — renders particles from a struct UBO
//
// Each particle has: vec2 pos, vec3 color, float radius
// All packed in a single UBO instead of separate arrays.

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float aspect = iResolution.x / iResolution.y;

    vec3 col = vec3(0.02);

    for (int i = 0; i < particles_count; i++) {
        vec2 p = particles[i].pos;
        vec3 c = particles[i].color;
        float r = particles[i].radius;

        // Aspect-correct distance
        vec2 d = uv - p;
        d.x *= aspect;
        float dist = length(d);

        // Soft glow
        float glow = r / max(dist, 0.001);
        glow = pow(glow, uGlow);
        col += c * glow * 0.02;
    }

    // Tone map
    col = col / (1.0 + col);
    col = pow(col, vec3(0.85));

    fragColor = vec4(col, 1.0);
}
