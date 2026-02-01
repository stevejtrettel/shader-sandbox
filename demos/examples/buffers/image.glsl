void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    fragColor = texelFetch(state, ivec2(fragCoord), 0);
}
