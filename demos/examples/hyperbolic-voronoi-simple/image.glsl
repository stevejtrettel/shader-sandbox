void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);
    float r = length(uv);

    // Outside the disk
    if (r >= 1.0) {
        fragColor = vec4(vec3(0.05), 1.0);
        return;
    }

    // Lift to the hyperboloid
    vec3 P = diskToHyperboloid(uv);

    // Find nearest seed point in hyperbolic distance
    float minDist = 1e20;
    int closest = 0;

    for (int i = 0; i < points_count; i++) {
        if (i >= uCount) break;
        float d = hypDist(P, points[i].xyz);
        if (d < minDist) {
            minDist = d;
            closest = i;
        }
    }

    fragColor = vec4(colors[closest].rgb, 1.0);
}
