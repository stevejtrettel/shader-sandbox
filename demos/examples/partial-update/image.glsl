// Partial Update — colored dots from a struct array
//
// Each dot: vec2 pos, float size, vec3 color
// Positions animate every frame; colors change only on slider input.

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float aspect = iResolution.x / iResolution.y;

    vec3 col = vec3(0.04);

    for (int i = 0; i < dots_count; i++) {
        vec2 p = dots[i].pos;
        float r = dots[i].size;
        vec3 c = dots[i].color;

        vec2 d = uv - p;
        d.x *= aspect;
        float dist = length(d);

        // Soft filled circle
        float mask = 1.0 - smoothstep(r * 0.6, r, dist);
        col = mix(col, c, mask);
    }

    fragColor = vec4(col, 1.0);
}
