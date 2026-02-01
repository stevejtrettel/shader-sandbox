// Dynamic light count — lights appear and disappear over time
// lights[i] = vec4(x, y, glow_radius, hue)
// lights_count is auto-injected by the engine

vec3 hueToRGB(float h) {
    return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float aspect = iResolution.x / iResolution.y;

    vec3 col = vec3(0.0);

    for (int i = 0; i < lights_count; i++) {
        vec4 l = lights[i];
        vec2 diff = uv - l.xy;
        diff.x *= aspect;
        float d = length(diff);

        // Soft radial glow
        float intensity = l.z / (d * d + 0.01);
        col += hueToRGB(l.w) * intensity * 0.004;
    }

    col = col / (col + 1.0);
    fragColor = vec4(col, 1.0);
}
