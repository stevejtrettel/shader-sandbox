void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5);
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;

    // iMouseDown tracks mouse position while held, freezes on release
    vec2 mouse = iMouseDown / iResolution.xy;
    mouse = mouse - vec2(0.5);
    mouse.x *= iResolution.x / iResolution.y;
    mouse = mouse * 4.0;

    bool held = iMouse.z > 0.0;

    float d = length(p - mouse);
    float r = 0.5;

    vec3 color = vec3(0.1, 0.1, 0.3);
    if (d < r) {
        color = held ? vec3(1.0, 0.9, 0.2) : vec3(0.4, 0.35, 0.1);
    }

    fragColor = vec4(color, 1.0);
}
