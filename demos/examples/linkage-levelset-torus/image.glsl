// Linkage Level Set on a 3D Torus
// Raymarches a torus, then colors based on the linkage level set

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

// Torus dimensions
const float MAJOR_R = 1.5;  // major radius (center of tube to center of torus)
const float MINOR_R = 0.5;  // minor radius (tube radius)

// Linkage parameter
const float L = 3.0;

// Colors
const vec3 SKY_COLOR = vec3(0.08, 0.12, 0.25);
const vec3 TORUS_COLOR = vec3(0.95, 0.93, 0.85);
const vec3 LINE_COLOR = vec3(0.15, 0.5, 0.95);
const vec3 GRID_COLOR = vec3(0.7, 0.68, 0.62);

// Grid settings - scaled by radius for uniform physical spacing
const float GRID_DIVISIONS_ALPHA = 24.0;  // around major circle
const float GRID_DIVISIONS_BETA = GRID_DIVISIONS_ALPHA * MINOR_R / MAJOR_R;  // around tube

// Structs
struct Ray {
    vec3 origin;
    vec3 dir;
};

struct Hit {
    float t;
    vec3 point;
    vec3 normal;
};

struct Light {
    vec3 dir;
    vec3 color;
};

// Rotation matrices
mat3 rotateX(float a) {
    float c = cos(a), s = sin(a);
    return mat3(1, 0, 0, 0, c, -s, 0, s, c);
}

mat3 rotateY(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, 0, s, 0, 1, 0, -s, 0, c);
}

// Camera
Ray generateRay(vec2 fragCoord) {
    vec2 uv = (fragCoord / iResolution.xy) * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    float fov = 60.0;
    float f = 1.0 / tan(radians(fov) / 2.0);

    Ray ray;
    ray.origin = vec3(0.0);
    ray.dir = normalize(vec3(uv, -f));
    return ray;
}

Ray orbitCamera(Ray ray, float distance) {
    vec2 mouse = iMouse.xy / iResolution.xy;
    if (length(iMouse.xy) < 1.0) mouse = vec2(0.3, 0.4); // default view

    float angleY = (mouse.x - 0.5) * TAU;
    float angleX = (0.5 - mouse.y) * PI;

    mat3 rot = rotateX(angleX) * rotateY(angleY);
    ray.origin = rot * vec3(0.0, 0.0, distance);
    ray.dir = rot * ray.dir;
    return ray;
}

// Torus SDF - major circle in xz plane, y is up
float torusSDF(vec3 p) {
    vec2 q = vec2(length(p.xz) - MAJOR_R, p.y);
    return length(q) - MINOR_R;
}

vec3 calcNormal(vec3 p) {
    float eps = 0.001;
    return normalize(vec3(
        torusSDF(p + vec3(eps, 0, 0)) - torusSDF(p - vec3(eps, 0, 0)),
        torusSDF(p + vec3(0, eps, 0)) - torusSDF(p - vec3(0, eps, 0)),
        torusSDF(p + vec3(0, 0, eps)) - torusSDF(p - vec3(0, 0, eps))
    ));
}

float raymarch(Ray ray) {
    float t = 0.0;
    for (int i = 0; i < 100; i++) {
        vec3 p = ray.origin + t * ray.dir;
        float d = torusSDF(p);
        if (d < 0.001) return t;
        t += d;
        if (t > 100.0) return -1.0;
    }
    return -1.0;
}

// Extract (alpha, beta) from a point on the torus surface
vec2 torusToAngles(vec3 p) {
    float alpha = atan(p.z, p.x);
    float beta = atan(p.y, length(p.xz) - MAJOR_R);
    return vec2(alpha, beta);
}

// Linkage function f(alpha, beta) = |p1 - p2|
float f(float alpha, float beta, float l1, float l3) {
    vec2 p1 = l1 * vec2(cos(alpha), sin(alpha));
    vec2 p2 = vec2(L - l3 * cos(beta), l3 * sin(beta));
    return length(p1 - p2);
}

// Subtle grid pattern with aspect-corrected spacing
float gridBlend(float alpha, float beta) {
    float spacingAlpha = TAU / GRID_DIVISIONS_ALPHA;
    float spacingBeta = TAU / GRID_DIVISIONS_BETA;
    float lineWidth = 0.02;

    float alphaGrid = abs(mod(alpha + spacingAlpha * 0.5, spacingAlpha) - spacingAlpha * 0.5);
    float betaGrid = abs(mod(beta + spacingBeta * 0.5, spacingBeta) - spacingBeta * 0.5);

    // Scale by radius to compare in physical space
    float alphaPhysical = alphaGrid * MAJOR_R;
    float betaPhysical = betaGrid * MINOR_R;

    float gridDist = min(alphaPhysical, betaPhysical);
    return 1.0 - smoothstep(lineWidth * 0.5, lineWidth * 1.5, gridDist);
}

// Check if on level set, returns blend factor
float levelSetBlend(float alpha, float beta, float level, float thickness) {
    float fVal = f(alpha, beta, uL1, uL3);

    // Numerical gradient
    float eps = 0.001;
    float dfda = (f(alpha + eps, beta, uL1, uL3) - f(alpha - eps, beta, uL1, uL3)) / (2.0 * eps);
    float dfdb = (f(alpha, beta + eps, uL1, uL3) - f(alpha, beta - eps, uL1, uL3)) / (2.0 * eps);
    float gradMag = length(vec2(dfda, dfdb));

    // Distance to level set in angle space
    float levelDist = abs(fVal - level) / max(gradMag, 0.001);

    return 1.0 - smoothstep(thickness * 0.8, thickness * 1.2, levelDist);
}

// Shading
vec3 shade(Hit hit, Light light, vec3 viewDir, vec3 baseColor) {
    float diffuse = max(0.0, dot(hit.normal, light.dir));
    vec3 reflected = reflect(-light.dir, hit.normal);
    float specular = pow(max(0.0, dot(reflected, viewDir)), 32.0);

    vec3 ambient = baseColor * 0.25;
    vec3 diff = baseColor * light.color * diffuse * 0.6;
    vec3 spec = light.color * specular * 0.2;
    return ambient + diff + spec;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    Ray ray = generateRay(fragCoord);
    ray = orbitCamera(ray, 5.0);

    Light light = Light(normalize(vec3(1.0, 1.0, 0.5)), vec3(1.0));

    float t = raymarch(ray);

    vec3 color = SKY_COLOR;

    if (t > 0.0) {
        vec3 p = ray.origin + t * ray.dir;
        vec3 normal = calcNormal(p);

        // Get torus angles
        vec2 angles = torusToAngles(p);

        // Grid pattern
        float grid = gridBlend(angles.x, angles.y);
        vec3 torusWithGrid = mix(TORUS_COLOR, GRID_COLOR, grid * 0.3);

        // Check level set
        float lineBlend = levelSetBlend(angles.x, angles.y, uL2, uLineWidth);

        // Base color: grid torus with level set line on top
        vec3 baseColor = mix(torusWithGrid, LINE_COLOR, lineBlend);

        // Shade
        Hit hit;
        hit.t = t;
        hit.point = p;
        hit.normal = normal;

        color = shade(hit, light, -ray.dir, baseColor);

        // Gamma correction (only for lit surfaces)
        color = pow(color, vec3(1.0 / 2.2));
    }

    fragColor = vec4(color, 1.0);
}
