void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;

    // Sample from the named buffer
    vec4 data = texture(trail, uv);

    fragColor = vec4(data.rgb, 1.0);
}
