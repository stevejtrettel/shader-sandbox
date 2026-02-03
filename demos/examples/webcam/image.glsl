// Webcam Input Demo
// "camera" is the live webcam feed

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Mirror horizontally for natural selfie view
    uv.x = 1.0 - uv.x;

    vec4 cam = texture(camera, uv);

    fragColor = vec4(cam.rgb, 1.0);
}
