// BufferA: Seed point data (computed once on frame 0, then preserved)
//
// Row 0: hyperboloid positions — pixel (i, 0).rgb = vec3(X, Y, Z)
// Row 1: cell colors           — pixel (i, 1).rgb = vec3(R, G, B)

const int   NUM_POINTS = 200;
const float RMAX       = 4.0;


// ---- Hash ----

float hash1(int n) {
    uint x = uint(n);
    x = ((x >> 16u) ^ x) * 0x45d9f3bu;
    x = ((x >> 16u) ^ x) * 0x45d9f3bu;
    x = (x >> 16u) ^ x;
    return float(x) / 4294967296.0;
}

vec2 hash2(int n) {
    return vec2(hash1(n), hash1(n + 7919));
}

vec3 hash3(int n) {
    return vec3(hash1(n), hash1(n + 7919), hash1(n + 17389));
}


// ---- Geometry ----

vec3 diskToHyperboloid(vec2 p) {
    float r2 = dot(p, p);
    float denom = 1.0 - r2;
    return vec3(2.0 * p / denom, (1.0 + r2) / denom);
}


// ---- Seed generation ----

vec3 seedPoint(int i) {
    vec2 h = hash2(i * 2);
    float hypR = acosh(1.0 + h.x * (cosh(RMAX) - 1.0));
    float r = tanh(hypR * 0.5);
    float theta = h.y * 6.28318530718;
    return diskToHyperboloid(r * vec2(cos(theta), sin(theta)));
}

vec3 seedColor(int i) {
    vec3 h = hash3(i * 2 + 1);
    float hue = float(i) / float(NUM_POINTS) + h.x * 0.1;
    float sat = 0.5 + 0.4 * h.y;
    float lit = 0.4 + 0.3 * h.z;
    vec3 c = clamp(abs(mod(hue * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return lit + sat * (c - 0.5) * (1.0 - abs(2.0 * lit - 1.0));
}


void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    ivec2 px = ivec2(fragCoord);

    // After frame 0, preserve existing data
    if (iFrame > 0) {
        fragColor = texelFetch(iChannel0, px, 0);
        return;
    }

    // Frame 0: write seed data into the first NUM_POINTS columns
    if (px.x >= NUM_POINTS || px.y >= 2) {
        fragColor = vec4(0.0);
        return;
    }

    if (px.y == 0) {
        fragColor = vec4(seedPoint(px.x), 1.0);
    } else {
        fragColor = vec4(seedColor(px.x), 1.0);
    }
}
