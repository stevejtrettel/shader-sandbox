// The simplest possible shader - no config file needed!
// Just create image.glsl and run: npm run dev:demo quickstart/01-hello-shader

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Convert pixel coordinates to 0-1 range
    vec2 uv = fragCoord / iResolution.xy;

    // Create a simple animated gradient
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));

    // Output the color
    fragColor = vec4(col, 1.0);
}
