// Linkage Level Set on the Torus
// Draws the level set f(a,b) = l2 where f = |p1 - p2|
// p1 = l1 * (cos a, sin a)
// p2 = (L, 0) + l3 * (-cos b, sin b)
// Domain: torus with a on x-axis, b on y-axis

const float L = 3.0;
const float PI = 3.14159265359;
const float TAU = 6.28318530718;

// How many fundamental domains to show (e.g., 2.0 = show 2x2 copies)
const float DOMAINS = 1.5;

// Colors
const vec3 BG_COLOR = vec3(0.05, 0.05, 0.1);
const vec3 LINE_COLOR = vec3(0.2, 0.7, 1.0);
const vec3 RECT_COLOR = vec3(0.4);
const vec3 GRID_COLOR = vec3(0.12, 0.12, 0.18);

// Grid settings
const float GRID_DIVISIONS = 16.0;  // lines per 2pi

// Pixels per radian at current resolution/zoom
float pxPerRad() {
    return min(iResolution.x, iResolution.y) / (TAU * DOMAINS);
}

// Convert fragment coordinates to angles (alpha, beta)
// Screen center maps to (0, 0), shows DOMAINS copies
vec2 toAngles(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float aspect = iResolution.x / iResolution.y;
    vec2 pos = uv - 0.5;
    pos.x *= aspect;
    pos *= DOMAINS;
    return pos * TAU;
}

// Draw square outline centered at origin, half-width h
// Returns blend factor for the outline
float drawSquare(vec2 p, float h, float thickness) {
    float boxSDF = max(abs(p.x) - h, abs(p.y) - h);
    float edgeDist = abs(boxSDF);
    return 1.0 - smoothstep(thickness - 1.5, thickness + 1.5, edgeDist);
}


// Subtle grid pattern
float gridBlend(vec2 angles) {
    float spacing = TAU / GRID_DIVISIONS;
    float lineWidth = 1.5;  // pixels

    float alphaGrid = abs(mod(angles.x + spacing * 0.5, spacing) - spacing * 0.5);
    float betaGrid = abs(mod(angles.y + spacing * 0.5, spacing) - spacing * 0.5);

    float gridDist = min(alphaGrid, betaGrid) * pxPerRad();
    return 1.0 - smoothstep(lineWidth * 0.5, lineWidth * 1.5, gridDist);
}

// Compute the function f(alpha, beta) = |p1 - p2|
float f(float alpha, float beta, float l1, float l3) {
    vec2 p1 = l1 * vec2(cos(alpha), sin(alpha));
    vec2 p2 = vec2(L - l3 * cos(beta), l3 * sin(beta));
    return length(p1 - p2);
}


// Draw level set {f = level} with fixed pixel thickness
float drawLevelSet(float alpha, float beta, float level, float thickness) {
    float fVal = f(alpha, beta, uL1, uL3);

    // Numerical gradient for even-thickness lines
    float eps = 0.001;
    float dfda = (f(alpha + eps, beta, uL1, uL3) - f(alpha - eps, beta, uL1, uL3)) / (2.0 * eps);
    float dfdb = (f(alpha, beta + eps, uL1, uL3) - f(alpha, beta - eps, uL1, uL3)) / (2.0 * eps);
    float gradMag = length(vec2(dfda, dfdb));

    // Distance to level set, corrected by gradient
    float levelDist = abs(fVal - level) / max(gradMag, 0.001);

    // Convert to pixels
    float d = levelDist * pxPerRad();

    return 1.0 - smoothstep(thickness - 1.5, thickness + 1.5, d);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 angles = toAngles(fragCoord);

    float grid = gridBlend(angles);
    float line = drawLevelSet(angles.x, angles.y, uL2, uLineWidth * pxPerRad());
    float rect = drawSquare(angles * pxPerRad(), PI * pxPerRad(), 2.0);

    vec3 col = mix(BG_COLOR, GRID_COLOR, grid * 0.5);
    col = mix(col, LINE_COLOR, line);
    col = mix(col, RECT_COLOR, rect * 0.7);

    fragColor = vec4(col, 1.0);
}
