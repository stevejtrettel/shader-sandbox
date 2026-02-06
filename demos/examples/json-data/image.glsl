// Visualize positions with directions as arrows
// Uses data loaded from JSON via script.js

vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

// Distance to a line segment
float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    vec3 col = vec3(0.02);

    const float pointSize = 0.04;
    const float arrowLength = 0.08;

    // Draw each point with its direction arrow
    for (int i = 0; i < positions_count; i++) {
        vec2 pos = positions[i].xy;
        vec2 dir = directions[i].xy;

        // Get coefficient for this point (cycle through the 20 coefficients)
        float coeff = coefficients[i % coefficients_count];

        // Point (circle)
        float d = length(uv - pos);
        float size = pointSize * coeff;
        float circle = smoothstep(size + 0.005, size - 0.005, d);

        // Color based on index
        float hue = float(i) / float(positions_count);
        vec3 pointCol = hsv2rgb(vec3(hue, 0.8, 1.0));

        col += circle * pointCol;

        // Direction arrow (line from point)
        vec2 arrowEnd = pos + dir * arrowLength * coeff;
        float lineDist = sdSegment(uv, pos, arrowEnd);
        float line = smoothstep(0.004, 0.001, lineDist);
        col += line * pointCol * 0.7;

        // Arrowhead
        float arrowheadDist = length(uv - arrowEnd);
        float arrowhead = smoothstep(0.012, 0.008, arrowheadDist);
        col += arrowhead * pointCol;
    }

    fragColor = vec4(col, 1.0);
}
