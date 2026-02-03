// Red: animated sine pattern

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float pattern = sin(uv.x * 10.0 + iTime) * 0.5 + 0.5;
    fragColor = vec4(pattern, 0.0, 0.0, 1.0);
}
