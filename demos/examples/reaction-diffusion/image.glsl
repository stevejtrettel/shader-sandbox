void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    float a = texture(field_a, uv).r;
    float b = texture(field_b, uv).r;

    // Color map: white where A dominates, dark blue where B dominates
    vec3 col = mix(
        vec3(0.0, 0.1, 0.3),   // B regions
        vec3(1.0, 0.98, 0.95), // A regions
        a - b
    );

    fragColor = vec4(col, 1.0);
}
