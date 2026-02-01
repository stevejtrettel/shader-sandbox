void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec3 color = texture(iChannel0, fragCoord / iResolution.xy).rgb;
    fragColor = vec4(color, 1.0f);
}
