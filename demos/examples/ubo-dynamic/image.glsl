// Projective reflection group orbit visualizer
// Draws a circle at mouse position and its orbit under all group elements

vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Coordinates centered at origin, roughly [-4, 4] vertically
    vec2 p = (fragCoord - 0.5 * iResolution.xy) / iResolution.y * 2.0;

    vec3 col = vec3(0.02);

    // iMouse.xy = last drag position, persists after release
    // Default to a point inside the domain before first click
    vec2 click = iMouse.x > 0.5 ? iMouse.xy : vec2(0.5 * iResolution.xy + vec2(30.0, 20.0));
    vec2 mouse = (click - 0.5 * iResolution.xy) / iResolution.y * 2.0;

    // Draw orbit — matrices_count is auto-injected by the engine
    for (int i = 0; i < matrices_count; i++) {
        // Apply matrix projectively: (x, y, 1) -> M * (x, y, 1), then divide by z
        vec3 mp = matrices[i] * vec3(mouse, 1.0);
        vec2 tp = mp.xy / mp.z;

        float dist = length(p - tp);
        float circle = smoothstep(uRadius + 0.005, uRadius - 0.005, dist);

        // Color by index: identity is white, then cycle through hues
        vec3 circleCol;
        if (i == 0) {
            circleCol = vec3(1.0);  // identity: white
        } else {
            float hue = float(i - 1) / float(max(matrices_count - 1, 1));
            circleCol = hsv2rgb(vec3(hue, 0.7, 1.0));
        }

        col += circle * circleCol;
    }

    fragColor = vec4(col, 1.0);
}
