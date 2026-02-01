// BufferA: Uses rot2D from common.glsl to create a rotating pattern

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;

    // Center coordinates
    vec2 p = uv - 0.5;
    p.x *= iResolution.x / iResolution.y;

    // Use shared rot2D function to rotate the pattern
    p = rot2D(iTime * 0.5) * p;

    // Create a simple pattern
    float pattern = sin(p.x * 10.0) * sin(p.y * 10.0);

    fragColor = vec4(vec3(pattern), 1.0);
}
