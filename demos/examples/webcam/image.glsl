// Webcam Input Demo
// "camera" is the live webcam feed

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Mirror horizontally for natural selfie view
    uv.x = 1.0 - uv.x;

    vec4 cam = texture(camera, uv);

    // Edge detection via luminance differences
    float dx = 1.0 / iResolution.x;
    float dy = 1.0 / iResolution.y;
    float l  = dot(cam.rgb, vec3(0.299, 0.587, 0.114));
    float lR = dot(texture(camera, vec2(1.0 - uv.x + dx, uv.y)).rgb, vec3(0.299, 0.587, 0.114));
    float lU = dot(texture(camera, vec2(1.0 - uv.x, uv.y + dy)).rgb, vec3(0.299, 0.587, 0.114));
    float edge = length(vec2(lR - l, lU - l)) * 8.0;

    // Mix original with edge-highlighted version
    vec3 col = mix(cam.rgb, cam.rgb + vec3(edge), 0.5);

    fragColor = vec4(col, 1.0);
}
