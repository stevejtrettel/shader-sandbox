// Hyperbolic Voronoi — edges only
//
// Draws the cell boundaries of a Voronoi tessellation
// in the Poincaré disk. Black edges on white background.
//
// Seed points are read from BufferA (iChannel0).

const int   NUM_POINTS     = 200;
const float EDGE_THICKNESS = 3.0;   // edge width in screen pixels


// ---- Hyperbolic geometry ----

float minkowski(vec3 a, vec3 b) {
    return a.x * b.x + a.y * b.y - a.z * b.z;
}

float hypDist(vec3 a, vec3 b) {
    return acosh(max(-minkowski(a, b), 1.0));
}

vec3 diskToHyperboloid(vec2 p) {
    float r2 = dot(p, p);
    float denom = 1.0 - r2;
    return vec3(2.0 * p / denom, (1.0 + r2) / denom);
}


// ---- Main ----

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

    if (length(uv) >= 1.0) {
        fragColor = vec4(vec3(1.0), 1.0);
        return;
    }

    vec3 P = diskToHyperboloid(uv);

    // Find nearest and second-nearest seed
    float d1 = 1e10;
    float d2 = 1e10;

    for (int i = 0; i < NUM_POINTS; i++) {
        vec3 Q = texelFetch(iChannel0, ivec2(i, 0), 0).xyz;
        float d = hypDist(P, Q);
        if (d < d1) {
            d2 = d1;
            d1 = d;
        } else if (d < d2) {
            d2 = d;
        }
    }

    // Edge: black where d2 ≈ d1, white elsewhere
    float edgeDiff = d2 - d1;

 
    float fw = fwidth(edgeDiff);
    float edge = smoothstep(0.0, fw * EDGE_THICKNESS, edgeDiff);

   // fragColor = vec4(vec3(edge), 1.0);
}
