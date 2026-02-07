// Parameter Selector for Circumradius Linkage
// Click to select L1 (horizontal) and L2 (vertical) parameters.
// Shows a visualization of valid parameter regions.

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Get parameters for this pixel
    vec2 params = getParams(uv);
    float L1 = params.x;
    float L2 = params.y;

    // Background gradient
    vec3 color = mix(vec3(0.05, 0.08, 0.12), vec3(0.1, 0.15, 0.2), uv.y);

    // Draw grid lines for parameter values
    float gridL1 = abs(fract(L1 * 10.0) - 0.5);
    float gridL2 = abs(fract(L2 * 5.0) - 0.5);
    float grid = 1.0 - smoothstep(0.02, 0.05, min(gridL1, gridL2));
    color = mix(color, vec3(0.3), grid * 0.3);

    // Show crosshair at current mouse position (the selected parameters)
    vec2 mouseUV = iMouse_params.xy / iResolution_params.xy;
    if (iMouse_params.x == 0.0 && iMouse_params.y == 0.0) {
        mouseUV = paramsToUV(DEFAULT_PARAMS);
    }

    // Crosshair
    float crossDist = min(abs(uv.x - mouseUV.x), abs(uv.y - mouseUV.y));
    float cross = 1.0 - smoothstep(0.002, 0.005, crossDist);
    color = mix(color, vec3(1.0, 0.9, 0.5), cross * 0.8);

    // Highlight selected point
    float pointDist = length(uv - mouseUV);
    float point = 1.0 - smoothstep(0.01, 0.015, pointDist);
    color = mix(color, vec3(1.0, 0.5, 0.2), point);

    fragColor = vec4(color, 1.0);
}
