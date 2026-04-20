// Hyperbolic Voronoi Tessellation (Full)
//
// Voronoi cells in the Poincaré disk with:
//   - Black cell boundary lines
//   - Seed point dots
//   - Möbius drag (click and hold to translate the view)
//
// Seed data is read from BufferA:
//   texelFetch(iChannel0, ivec2(i, 0), 0).xyz = hyperboloid position
//   texelFetch(iChannel0, ivec2(i, 1), 0).rgb = cell color

const int   NUM_POINTS = 200;

const float BOUNDARY_WIDTH = 0.005;
const float EDGE_THICKNESS = 3.0;
const float SEED_RADIUS    = 0.05;
const float MOUSE_CLAMP    = 0.98;

const vec3 BACKGROUND_COLOR = vec3(0.05);
const vec3 BOUNDARY_COLOR   = vec3(0.6);
const vec3 EDGE_COLOR       = vec3(0.0);
const vec3 SEED_COLOR       = vec3(0.0);


// =============================================
// Complex Arithmetic
// =============================================

vec2 cconj(vec2 z) {
    return vec2(z.x, -z.y);
}

vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
    return cmul(a, cconj(b)) / dot(b, b);
}


// =============================================
// Hyperbolic Geometry
// =============================================

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

vec2 mobiusTranslate(vec2 z, vec2 a) {
    vec2 num = z + a;
    vec2 den = vec2(1.0, 0.0) + cmul(cconj(a), z);
    return cdiv(num, den);
}


// =============================================
// Coordinate Conversion
// =============================================

vec2 pixelToDisk(vec2 fragCoord) {
    return (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);
}


// =============================================
// Voronoi Search
// =============================================

struct VoronoiResult {
    int   closest;
    float minDist;
    float secondDist;
};

VoronoiResult voronoiSearch(vec3 P) {
    VoronoiResult result;
    result.closest    = 0;
    result.minDist    = 1e20;
    result.secondDist = 1e20;

    for (int i = 0; i < NUM_POINTS; i++) {
        vec3 Q = texelFetch(iChannel0, ivec2(i, 0), 0).xyz;
        float d = hypDist(P, Q);
        if (d < result.minDist) {
            result.secondDist = result.minDist;
            result.minDist    = d;
            result.closest    = i;
        } else if (d < result.secondDist) {
            result.secondDist = d;
        }
    }

    return result;
}


// =============================================
// Shading
// =============================================

vec3 shadeVoronoi(VoronoiResult vor) {
    vec3 col = texelFetch(iChannel0, ivec2(vor.closest, 1), 0).rgb;

    // Cell edges
    float edgeDiff = vor.secondDist - vor.minDist;
    float fw = fwidth(edgeDiff);
    float edgeMask = smoothstep(0.0, fw * EDGE_THICKNESS, edgeDiff);
    col = mix(EDGE_COLOR, col, edgeMask);

    // Seed dots
    if (vor.minDist < SEED_RADIUS) {
        col = SEED_COLOR;
    }

    return col;
}


// =============================================
// View Transform
// =============================================

vec2 applyViewTransform(vec2 diskPos) {
    if (iMouse.z > 0.0) {
        vec2 mouseDisk = pixelToDisk(iMouse.xy);
        if (length(mouseDisk) < MOUSE_CLAMP) {
            return mobiusTranslate(diskPos, -mouseDisk);
        }
    }
    return diskPos;
}


// =============================================
// Main
// =============================================

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = pixelToDisk(fragCoord);
    float r = length(uv);

    if (r >= 1.0) {
        fragColor = vec4(BACKGROUND_COLOR, 1.0);
        return;
    }

    if (r > 1.0 - BOUNDARY_WIDTH) {
        fragColor = vec4(BOUNDARY_COLOR, 1.0);
        return;
    }

    vec2 diskPos = applyViewTransform(uv);
    vec3 P = diskToHyperboloid(diskPos);
    VoronoiResult vor = voronoiSearch(P);

    fragColor = vec4(shadeVoronoi(vor), 1.0);
}
