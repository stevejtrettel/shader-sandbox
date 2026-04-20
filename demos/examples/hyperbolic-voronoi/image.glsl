// Drawing parameters
const float BOUNDARY_WIDTH = 0.005;   // thickness of the disk boundary circle
const float EDGE_THICKNESS  = 3.0;    // cell edge width in screen pixels
const float SEED_RADIUS     = 0.05;   // seed dot radius in hyperbolic distance
const float MOUSE_CLAMP     = 0.98;   // max disk radius for mouse interaction

const vec3 BACKGROUND_COLOR = vec3(0.05);
const vec3 BOUNDARY_COLOR   = vec3(0.6);
const vec3 EDGE_COLOR       = vec3(0.0);
const vec3 SEED_COLOR       = vec3(0.0);

const float PI = 3.14159265359;


// Convert pixel coordinates to centered, aspect-corrected
// coordinates in [-1, 1]² (mapped to the shorter axis).
vec2 pixelToDisk(vec2 fragCoord) {
    return (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);
}

// Convert pixel coordinates to band model coordinates.
// The strip has height π (from -π/2 to π/2), centered vertically.
// Horizontal extent follows the aspect ratio.
vec2 pixelToBand(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy - 0.5;  // [-0.5, 0.5]²
    float aspect = iResolution.x / iResolution.y;
    return vec2(uv.x * aspect * PI, uv.y * PI);
}


// Result of a Voronoi nearest-neighbor search.
struct VoronoiResult {
    int   closest;      // index of the nearest seed point
    float minDist;      // hyperbolic distance to nearest seed
    float secondDist;   // hyperbolic distance to second-nearest seed
};

// Find the nearest and second-nearest seed points (in hyperbolic
// distance) to a point P on the hyperboloid.
VoronoiResult voronoiSearch(vec3 P, int count) {
    VoronoiResult result;
    result.closest    = 0;
    result.minDist    = 1e20;
    result.secondDist = 1e20;

    for (int i = 0; i < points_count; i++) {
        if (i >= count) break;
        float d = hypDist(P, points[i]);
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


// Shade a Voronoi cell: color, edges, and seed dot.
vec3 shadeVoronoi(VoronoiResult vor) {
    vec3 col = colors[vor.closest].rgb;

    // Cell edges: black lines at constant screen-pixel width
    float edgeDiff = vor.secondDist - vor.minDist;
    float fw = fwidth(edgeDiff);
    float edgeMask = smoothstep(0.0, fw * EDGE_THICKNESS, edgeDiff);
    col = mix(EDGE_COLOR, col, edgeMask);

    // Seed dots at fixed hyperbolic radius
    if (vor.minDist < SEED_RADIUS) {
        col = SEED_COLOR;
    }

    return col;
}


// Apply the mouse-driven Möbius view transform.
// Converts the mouse position to disk coordinates (via the
// current view model) and applies a Möbius translation.
vec2 applyViewTransform(vec2 diskPos) {
    if (iMouse.z > 0.0) {
        vec2 mouseDisk;
        if (uBandModel) {
            mouseDisk = bandToDisk(pixelToBand(iMouse.xy));
        } else {
            mouseDisk = pixelToDisk(iMouse.xy);
        }
        if (length(mouseDisk) < MOUSE_CLAMP) {
            return mobiusTranslate(diskPos, -mouseDisk);
        }
    }
    return diskPos;
}


// ---- Poincaré disk view ----

void renderDisk(out vec4 fragColor, in vec2 fragCoord) {
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
    VoronoiResult vor = voronoiSearch(P, uCount);

    fragColor = vec4(shadeVoronoi(vor), 1.0);
}


// ---- Band model view ----

void renderBand(out vec4 fragColor, in vec2 fragCoord) {
    vec2 bandPos = pixelToBand(fragCoord);

    // The strip is |Im| < π/2; outside is background
    if (abs(bandPos.y) >= PI * 0.5) {
        fragColor = vec4(BACKGROUND_COLOR, 1.0);
        return;
    }

    // Band boundary lines
    if (abs(bandPos.y) > PI * 0.5 - BOUNDARY_WIDTH * PI) {
        fragColor = vec4(BOUNDARY_COLOR, 1.0);
        return;
    }

    // Band → disk → Möbius transform → hyperboloid
    vec2 diskPos = bandToDisk(bandPos);
    diskPos = applyViewTransform(diskPos);
    vec3 P = diskToHyperboloid(diskPos);
    VoronoiResult vor = voronoiSearch(P, uCount);

    fragColor = vec4(shadeVoronoi(vor), 1.0);
}


void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    if (uBandModel) {
        renderBand(fragColor, fragCoord);
    } else {
        renderDisk(fragColor, fragCoord);
    }
}
