void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalize fragment coordinate
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;
    
    // Normalize mouse coordinate the same way
    vec2 mouse = iMouse.xy / iResolution.xy;
    mouse = mouse - vec2(0.5, 0.5);
    mouse.x *= iResolution.x / iResolution.y;
    mouse = mouse * 4.0;

    // Circle centered at mouse (only visible while clicking)
    float d = length(p - mouse);
    float r = 0.5;

    vec3 color;
    if (iMouse.z > 0.0 && d < r) {
        color = vec3(1.0, 0.9, 0.2);
    } else {
        color = vec3(0.1, 0.1, 0.3);
    }
    
    fragColor = vec4(color, 1.0);
}