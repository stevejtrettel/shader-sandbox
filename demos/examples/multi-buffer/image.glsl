// Image: composite all three buffers

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    vec3 r = texture(red, uv).rgb;
    vec3 g = texture(green, uv).rgb;
    vec3 b = texture(blue, uv).rgb;

    fragColor = vec4(r + g + b, 1.0);
}
