// Particle state - positions and velocities
const particles = [];
const NUM_PARTICLES = 50;

export function setup(engine) {
  // Initialize particles with random positions and velocities
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    });
  }
}

export function onFrame(engine, time, deltaTime, frame) {
  // Update particle positions
  for (const p of particles) {
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;

    // Bounce off walls
    if (p.x < 0 || p.x > 1) {
      p.vx *= -1;
      p.x = Math.max(0, Math.min(1, p.x));
    }
    if (p.y < 0 || p.y > 1) {
      p.vy *= -1;
      p.y = Math.max(0, Math.min(1, p.y));
    }
  }

  // Pack particle data into Float32Array for the shader
  // Each particle is a vec4: (x, y, vx, vy)
  const data = new Float32Array(NUM_PARTICLES * 4);
  for (let i = 0; i < NUM_PARTICLES; i++) {
    const p = particles[i];
    data[i * 4 + 0] = p.x;
    data[i * 4 + 1] = p.y;
    data[i * 4 + 2] = p.vx;
    data[i * 4 + 3] = p.vy;
  }

  engine.setUniformValue('uParticles', data);
}
