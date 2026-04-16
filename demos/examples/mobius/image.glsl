// Möbius Transformations on the Riemann Sphere
//
// Drag to rotate the sphere. Distortion slider applies a Blaschke
// factor centered on the screen center (whatever you're looking at).

#define PI  3.14159265359
#define TAU 6.28318530718

// ── Complex arithmetic ──────────────────────────────────────────

vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
    float d = dot(b, b);
    return vec2(dot(a, b), a.y*b.x - a.x*b.y) / d;
}

vec2 cconj(vec2 z) {
    return vec2(z.x, -z.y);
}

// ── Stereographic projection (from south pole) ─────────────────
//    North pole (0,0,1) ↔ origin
//    South pole (0,0,-1) ↔ infinity

vec2 stereoProject(vec3 p) {
    return p.xy / (1.0 + p.z);
}

vec3 stereoInverse(vec2 z) {
    float r2 = dot(z, z);
    return vec3(2.0 * z, 1.0 - r2) / (r2 + 1.0);
}

// ── Equirectangular lookup ──────────────────────────────────────

vec2 dirToEquirect(vec3 dir) {
    float lon = atan(dir.z, dir.x);
    float lat = asin(clamp(dir.y, -1.0, 1.0));
    return vec2(lon / TAU + 0.5, lat / PI + 0.5);
}

// ── Main ────────────────────────────────────────────────────────

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    // 1. Camera ray — screen center (0,0) maps to forward direction (0,0,1)
    vec3 rd = normalize(vec3(uv, 1.0));

    // 2. Stereographic project in camera space — screen center = z = 0
    vec2 z = stereoProject(rd);

    // 3. Möbius distortion (Blaschke factor + spin) centered at origin
    //    B_α(z) = (z − α) / (1 − ᾱz),  composed with rotation e^{iθ}
    vec2 alpha = uDistort * vec2(cos(uDistortAngle), sin(uDistortAngle));
    vec2 eiTheta = vec2(cos(uSpin), sin(uSpin));
    vec2 w = cmul(eiTheta, cdiv(z - alpha, vec2(1.0, 0.0) - cmul(cconj(alpha), z)));

    // 4. Back to a direction in camera space
    vec3 dir = stereoInverse(w);

    // 5. Rotate from camera space to world space
    float lon = uRotation.x;
    float lat = uRotation.y;
    float cLon = cos(lon), sLon = sin(lon);
    float cLat = cos(lat), sLat = sin(lat);
    // Y rotation (longitude)
    dir = vec3(cLon*dir.x + sLon*dir.z, dir.y, -sLon*dir.x + cLon*dir.z);
    // X rotation (latitude)
    dir = vec3(dir.x, cLat*dir.y - sLat*dir.z, sLat*dir.y + cLat*dir.z);

    // 6. Sample equirectangular texture
    vec2 tc = dirToEquirect(dir);
    vec3 col = texture(envMap, tc).rgb;

    fragColor = vec4(col, 1.0);
}
