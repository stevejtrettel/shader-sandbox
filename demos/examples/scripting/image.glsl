// Scripting API Demo — JS-generated waveform texture
// "waveform" is a 512x1 texture uploaded by script.js each frame

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Read waveform value at this x position
    float wave = texture(waveform, vec2(uv.x, 0.5)).r;

    // Convert from 0-1 range back to -1 to 1
    wave = wave * 2.0 - 1.0;

    // Map wave to y position
    float waveY = 0.5 + wave * 0.4;

    // Draw the waveform as a glowing line
    float dist = abs(uv.y - waveY);
    vec3 col = vec3(0.2, 0.8, 0.4) * smoothstep(0.015, 0.002, dist);

    // Fill below the wave with a subtle color
    if (uv.y < waveY) {
        col += vec3(0.05, 0.15, 0.1) * (1.0 - dist * 4.0);
    }

    // Center line
    col += vec3(0.1) * smoothstep(0.002, 0.0, abs(uv.y - 0.5));

    fragColor = vec4(col, 1.0);
}
