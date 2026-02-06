// Julia Set Viewer
// The Julia parameter 'c' is taken from the Mandelbrot view's mouse position.

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 0.5);
    vec3 d = vec3(0.8, 0.9, 0.3);
    return a + b * cos(6.28318 * (c * t + d));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Map to complex plane: z in [-2, 2] x [-2, 2]
    vec2 uv = fragCoord / iResolution.xy;
    vec2 z = vec2(
        mix(-2.0, 2.0, uv.x),
        mix(-2.0, 2.0, uv.y)
    );

    // Get Julia parameter from Mandelbrot view's mouse position
    // Map Mandelbrot mouse coords to complex plane
    vec2 mandelbrotMouseUV = iMouse_mandelbrot.xy / iResolution_mandelbrot.xy;
    vec2 c = vec2(
        mix(-2.5, 1.0, mandelbrotMouseUV.x),
        mix(-1.5, 1.5, mandelbrotMouseUV.y)
    );

    // Default to an interesting Julia set if no mouse interaction yet
    // Use xy position (which retains last click) instead of z (which is only set during press)
    if (iMouse_mandelbrot.x == 0.0 && iMouse_mandelbrot.y == 0.0) {
        c = vec2(-0.7, 0.27015); // Classic Julia set
    }

    // Julia iteration: z = z^2 + c (c is fixed, z varies)
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
}
