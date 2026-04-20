// BufferA: Seed points on the hyperboloid (computed once on frame 0)
// Pixel (i, 0).xyz = hyperboloid position of the i-th seed

const int   NUM_POINTS = 200;
const float RMAX       = 4.0;

float hash1(int n) {
    uint x = uint(n);
    x = ((x >> 16u) ^ x) * 0x45d9f3bu;
    x = ((x >> 16u) ^ x) * 0x45d9f3bu;
    x = (x >> 16u) ^ x;
    return float(x) / 4294967296.0;
}

vec3 diskToHyperboloid(vec2 p) {
    float r2 = dot(p, p);
    float denom = 1.0 - r2;
    return vec3(2.0 * p / denom, (1.0 + r2) / denom);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    ivec2 px = ivec2(fragCoord);

    if (iFrame > 0) {
        fragColor = texelFetch(iChannel0, px, 0);
        return;
    }

    if (px.x >= NUM_POINTS || px.y >= 1) {
        fragColor = vec4(0.0);
        return;
    }

    // Generate seed point uniform in hyperbolic area
    float u = hash1(px.x * 2);
    float v = hash1(px.x * 2 + 7919);
    float hypR = acosh(1.0 + u * (cosh(RMAX) - 1.0));
    float r = tanh(hypR * 0.5);
    float theta = v * 6.28318530718;

    fragColor = vec4(diskToHyperboloid(r * vec2(cos(theta), sin(theta))), 1.0);
}
