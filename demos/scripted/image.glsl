void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;

    // Dark background
    vec3 col = vec3(0.05);

    // Draw each particle
    for (int i = 0; i < 50; i++) {
        vec4 particle = uParticles[i];
        vec2 pos = particle.xy;
        vec2 vel = particle.zw;

        // Distance to particle center
        float d = length(uv - pos);

        // Soft circle with glow
        float intensity = smoothstep(uParticleSize, 0.0, d);
        float glow = smoothstep(uParticleSize * 3.0, 0.0, d) * 0.3;

        // Add velocity-based color variation
        float speed = length(vel);
        vec3 particleCol = uParticleColor * (1.0 + speed * 2.0);

        col += particleCol * (intensity + glow);
    }

    fragColor = vec4(col, 1.0);
}
