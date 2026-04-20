// Hyperbolic Voronoi Tessellation
//
// Voronoi cells in the Poincaré disk model of hyperbolic geometry.
// Distances are computed on the hyperboloid model for numerical
// stability, then projected to the disk for display.
//
// Seed points and colors are read from BufferA (computed once on frame 0):
//   texelFetch(iChannel0, ivec2(i, 0), 0).xyz = hyperboloid position
//   texelFetch(iChannel0, ivec2(i, 1), 0).rgb = cell color

const int NUM_POINTS = 20;


// =============================================
// Hyperbolic Geometry
// =============================================

// Minkowski inner product with signature (+, +, -)
float minkowski(vec3 a, vec3 b) {
    return a.x * b.x + a.y * b.y - a.z * b.z;
}

// Hyperbolic distance between two points on the hyperboloid.
// cosh(d) = -<a, b> where <,> is the Minkowski form.
float hypDist(vec3 a, vec3 b) {
    return acosh(max(-minkowski(a, b), 1.0));
}

// Map from the Poincaré disk to the hyperboloid.
vec3 diskToHyperboloid(vec2 p) {
    float r2 = dot(p, p);
    float denom = 1.0 - r2;
    return vec3(2.0 * p / denom, (1.0 + r2) / denom);
}


// =============================================
// Main
// =============================================

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);
    float r = length(uv);

    // Outside the disk
    if (r >= 1.0) {
        fragColor = vec4(vec3(0.05), 1.0);
        return;
    }

    // Lift to the hyperboloid
    vec3 P = diskToHyperboloid(uv);

    // Find nearest seed point in hyperbolic distance
    float minDist = 1e20;
    int closest = 0;

    for (int i = 0; i < NUM_POINTS; i++) {
        vec3 Q = texelFetch(iChannel0, ivec2(i, 0), 0).xyz;
        float d = hypDist(P, Q);
        if (d < minDist) {
            minDist = d;
            closest = i;
        }
    }

    // Look up color from BufferA row 1
    vec3 col = texelFetch(iChannel0, ivec2(closest, 1), 0).rgb;
    fragColor = vec4(col, 1.0);
}
