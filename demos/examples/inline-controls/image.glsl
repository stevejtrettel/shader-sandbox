void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float t = iTime * uSpeed;
    vec3 col = 0.5 + 0.5 * cos(t + uv.xyx * 6.0 + vec3(0.0, 2.0, 4.0));
    fragColor = vec4(col, 1.0);
}
