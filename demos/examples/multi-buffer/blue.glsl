// Blue: pattern modulated by green buffer

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float fromGreen = texture(green, uv).g;
    float pattern = sin((uv.x + uv.y) * 10.0 - iTime) * 0.5 + 0.5;
    fragColor = vec4(0.0, 0.0, pattern * fromGreen, 1.0);
}
