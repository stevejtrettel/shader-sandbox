// Audio Input Demo
// "mic" is a 512x2 texture:
//   Row 0 (y=0.25): FFT frequency spectrum
//   Row 1 (y=0.75): Raw waveform

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Sample FFT (bottom half) and waveform (top half)
    float fft = texture(mic, vec2(uv.x, 0.25)).r;
    float wave = texture(mic, vec2(uv.x, 0.75)).r;

    vec3 col = vec3(0.0);

    if (uv.y < 0.5) {
        // Bottom half: FFT bars
        float barHeight = fft * 0.5;
        if (uv.y < barHeight) {
            float intensity = uv.y / barHeight;
            col = mix(vec3(0.1, 0.4, 1.0), vec3(1.0, 0.2, 0.4), intensity);
        }
    } else {
        // Top half: waveform line
        float waveY = 0.5 + wave * 0.4;
        float dist = abs(uv.y - waveY);
        col = vec3(0.2, 0.9, 0.4) * smoothstep(0.01, 0.002, dist);
    }

    // Divider line
    col += vec3(0.15) * smoothstep(0.003, 0.0, abs(uv.y - 0.5));

    fragColor = vec4(col, 1.0);
}
