// Mandelbrot Set Viewer
// Click and drag to explore. Your click position becomes the Julia set parameter.

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.0, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Map to complex plane: x in [-2.5, 1], y in [-1.5, 1.5]
    vec2 uv = fragCoord / iResolution.xy;
    vec2 c = vec2(
        mix(-2.5, 1.0, uv.x),
        mix(-1.5, 1.5, uv.y)
    );

    // Mandelbrot iteration: z = z^2 + c, starting from z = 0
    vec2 z = vec2(0.0);
    int iter = 0;

    for (int i = 0; i < 500; i++) {
        if (i >= uMaxIter) break;
        if (dot(z, z) > 4.0) break;

        // z = z^2 + c
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iter++;
    }

    // Color based on escape iteration
    if (iter >= uMaxIter) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0); // Inside set
    } else {
        float t = float(iter) / float(uMaxIter);
        // Smooth coloring
        float log_zn = log(dot(z, z)) / 2.0;
        float nu = log(log_zn / log(2.0)) / log(2.0);
        t = (float(iter) + 1.0 - nu) / float(uMaxIter);
        fragColor = vec4(palette(t), 1.0);
    }

    // Show crosshair at current mouse position (the Julia parameter)
    vec2 mouseUV = iMouse_mandelbrot.xy / iResolution_mandelbrot.xy;
    vec2 mouseC = vec2(
        mix(-2.5, 1.0, mouseUV.x),
        mix(-1.5, 1.5, mouseUV.y)
    );

    float dist = length(c - mouseC);
    if (dist < 0.02) {
        fragColor = mix(fragColor, vec4(1.0), 0.5);
    }
}
