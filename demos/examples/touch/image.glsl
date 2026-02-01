// Touch Test Demo
// Tests all touch uniforms: iTouchCount, iTouch0-2, iPinch, iPinchCenter

// Draw a circle
float circle(vec2 uv, vec2 center, float radius, float softness) {
    float d = length(uv - center);
    return smoothstep(radius + softness, radius - softness, d);
}

// Draw a ring
float ring(vec2 uv, vec2 center, float radius, float thickness, float softness) {
    float d = length(uv - center);
    return smoothstep(radius + thickness/2.0 + softness, radius + thickness/2.0 - softness, d) *
           smoothstep(radius - thickness/2.0 - softness, radius - thickness/2.0 + softness, d);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord;

    // Background: subtle gradient
    vec3 col = mix(vec3(0.05, 0.05, 0.1), vec3(0.1, 0.1, 0.15), fragCoord.y / iResolution.y);

    // Grid pattern (scales with pinch)
    float gridSize = 50.0 * iPinch;
    vec2 grid = mod(fragCoord, gridSize);
    float gridLine = step(gridSize - 1.0, grid.x) + step(gridSize - 1.0, grid.y);
    col += gridLine * 0.05;

    // Draw pinch center and scale indicator when pinching
    if (iTouchCount >= 2) {
        // Pinch center crosshair
        vec2 pc = iPinchCenter;
        float crossSize = 30.0;
        float crossThick = 2.0;

        if (abs(fragCoord.x - pc.x) < crossThick && abs(fragCoord.y - pc.y) < crossSize) {
            col = vec3(1.0, 1.0, 0.0); // Yellow crosshair
        }
        if (abs(fragCoord.y - pc.y) < crossThick && abs(fragCoord.x - pc.x) < crossSize) {
            col = vec3(1.0, 1.0, 0.0);
        }

        // Ring showing pinch scale
        float pinchRadius = 100.0 * iPinch;
        col += ring(uv, pc, pinchRadius, 3.0, 2.0) * vec3(1.0, 0.8, 0.0);
    }

    // Touch colors for each finger
    vec3 touchColors[3];
    touchColors[0] = vec3(1.0, 0.3, 0.3); // Red - primary
    touchColors[1] = vec3(0.3, 1.0, 0.3); // Green - second
    touchColors[2] = vec3(0.3, 0.3, 1.0); // Blue - third

    // Draw touch points
    for (int i = 0; i < 3; i++) {
        if (i >= iTouchCount) break;

        vec4 touch = (i == 0) ? iTouch0 : (i == 1) ? iTouch1 : iTouch2;
        vec2 pos = touch.xy;
        vec2 startPos = touch.zw;

        // Outer ring at current position
        col += ring(uv, pos, 40.0, 4.0, 2.0) * touchColors[i];

        // Filled circle at current position
        col += circle(uv, pos, 20.0, 2.0) * touchColors[i] * 0.8;

        // Small dot at start position
        col += circle(uv, startPos, 8.0, 2.0) * touchColors[i] * 0.5;

        // Line from start to current (drag trail)
        vec2 dir = pos - startPos;
        float len = length(dir);
        if (len > 1.0) {
            vec2 n = dir / len;
            vec2 toFrag = fragCoord - startPos;
            float proj = clamp(dot(toFrag, n), 0.0, len);
            vec2 closest = startPos + n * proj;
            float lineDist = length(fragCoord - closest);
            col += smoothstep(3.0, 1.0, lineDist) * touchColors[i] * 0.4;
        }
    }

    // Info text area (top-left)
    if (fragCoord.x < 300.0 && fragCoord.y > iResolution.y - 120.0) {
        col *= 0.3; // Darken background for text visibility
    }

    // Draw touch count indicator (simple bars)
    for (int i = 0; i < iTouchCount && i < 5; i++) {
        vec2 barPos = vec2(20.0 + float(i) * 25.0, iResolution.y - 30.0);
        if (fragCoord.x > barPos.x && fragCoord.x < barPos.x + 20.0 &&
            fragCoord.y > barPos.y - 15.0 && fragCoord.y < barPos.y + 15.0) {
            col = vec3(0.0, 1.0, 0.5);
        }
    }

    // Pinch indicator bar
    float pinchBarWidth = 200.0;
    float pinchBarHeight = 10.0;
    vec2 pinchBarPos = vec2(20.0, iResolution.y - 60.0);

    // Bar background
    if (fragCoord.x > pinchBarPos.x && fragCoord.x < pinchBarPos.x + pinchBarWidth &&
        fragCoord.y > pinchBarPos.y && fragCoord.y < pinchBarPos.y + pinchBarHeight) {
        col = vec3(0.2);

        // Pinch level (centered at 1.0)
        float pinchNorm = clamp((iPinch - 0.5) / 1.5, 0.0, 1.0); // 0.5 to 2.0 range
        float fillWidth = pinchNorm * pinchBarWidth;
        if (fragCoord.x < pinchBarPos.x + fillWidth) {
            col = mix(vec3(0.3, 0.3, 1.0), vec3(1.0, 0.5, 0.0), pinchNorm);
        }

        // Center marker (where pinch = 1.0)
        float centerX = pinchBarPos.x + pinchBarWidth * 0.333; // 1.0 in our 0.5-2.0 range
        if (abs(fragCoord.x - centerX) < 2.0) {
            col = vec3(1.0);
        }
    }

    // Mouse fallback indicator (shows iMouse when no touch)
    if (iTouchCount == 0 && iMouse.z > 0.0) {
        col += circle(uv, iMouse.xy, 15.0, 2.0) * vec3(0.5, 0.5, 0.5);
        col += ring(uv, iMouse.xy, 25.0, 2.0, 1.0) * vec3(0.3, 0.3, 0.3);
    }

    fragColor = vec4(col, 1.0);
}
