// Image: Uses palette from common.glsl to color the pattern

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;

    // Read pattern from pattern buffer
    float pattern = texture(pattern, uv).r;

    // Use shared palette function to color it
    vec3 col = palette(pattern + iTime * 0.1);

    fragColor = vec4(col, 1.0);
}
