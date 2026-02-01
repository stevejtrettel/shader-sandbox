// BufferB: Green pattern based on BufferA

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float fromA = texture(iChannel0, uv).r;
    float pattern = sin(uv.y * 10.0 + iTime * 0.5) * 0.5 + 0.5;
    fragColor = vec4(0.0, pattern * (1.0 - fromA), 0.0, 1.0);
}
