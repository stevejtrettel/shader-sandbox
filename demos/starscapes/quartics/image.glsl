// ============================================================
// QUARTIC ALGEBRAIC NUMBERS IN THE UPPER HALF PLANE
//
// A quartic with leading coefficient a and root z factors as
//
//   a · (x² - 2sx + n)(x² + px + q)
//
// Fix integer a, then fix integer B (giving p = B/a + 2s).
// This reduces to a line in (C,D,E)-space parameterized by q:
//
//   L(q) = a(n-2sp, np, 0) + q · a(1, -2s, n)
//
// Loop over a, then B, raymarching each line.
//
// Set A_MAX = 1 for monic only, higher for general quartics.
//
// Colors:
//   BLACK/GRAY - irreducible quartic (darker = smaller |a|)
//   BLUE       - irreducible but splits as two irreducible
//                quadratics over a quadratic extension
//   WHITE      - no hit
// ============================================================

// --- Search parameters ---
const float BALL_RADIUS = 0.005;
const float Q_MAX = 50.0;
const float HIT_THRESHOLD = 0.001;
const int   MAX_STEPS = 128;

const int A_MAX = 1;             // 1 = monic only
const int B_MIN = -10;
const int B_MAX = 10;
const int P_RANGE = 15;

// --- View ---
const vec2 VIEW_CENTER = vec2(0.0, 1.5);
const float VIEW_HEIGHT = 3.0;

const bool IRREDUCIBLE_ONLY = true;

const int NO_HIT = 0;
const int HIT_GENERIC = 1;
const int HIT_BIQUADRATIC = 2;

// ============================================================
// Lattice SDF
// ============================================================

float sdfLatticeBalls(vec3 pt, float radius) {
    return length(pt - round(pt)) - radius;
}

// ============================================================
// Irreducibility checks
//
// Check 1: rational linear factor.
// We know the second factor x²+px+q. If it has real roots,
// compute them and check if either is rational with denominator
// dividing a.
//
// Check 2: product of two integer quadratics.
// Factor a = a1·a2, loop over P with a1·R + a2·P = B,
// then solve for Q, S.
// ============================================================

bool hasRationalRoot(int a, int B, int C, int D, int E,
                     float p, float q) {
    if (E == 0) return true;

    float disc = p * p - 4.0 * q;
    if (disc < 0.0) return false;

    float sqrtDisc = sqrt(disc);
    float r1 = (-p + sqrtDisc) / 2.0;
    float r2 = (-p - sqrtDisc) / 2.0;

    int absA = abs(a);
    for (int d = 1; d <= absA; d++) {
        if (absA % d != 0) continue;
        float fd = float(d);

        // Check r1
        float fn = round(fd * r1);
        // Use float to avoid int overflow on large num/d combos.
        float fval = float(a)*fn*fn*fn*fn + float(B)*fn*fn*fn*fd
                   + float(C)*fn*fn*fd*fd + float(D)*fn*fd*fd*fd
                   + float(E)*fd*fd*fd*fd;
        if (abs(fval) < 0.5) return true;

        // Check r2
        fn = round(fd * r2);
        fval = float(a)*fn*fn*fn*fn + float(B)*fn*fn*fn*fd
             + float(C)*fn*fn*fd*fd + float(D)*fn*fd*fd*fd
             + float(E)*fd*fd*fd*fd;
        if (abs(fval) < 0.5) return true;
    }
    return false;
}

bool factorsAsTwoIntegerQuadratics(int a, int B, int C, int D, int E) {
    int absA = abs(a);
    for (int a1 = 1; a1 <= absA; a1++) {
        if (absA % a1 != 0) continue;
        int a2 = a / a1;

        for (int P = -P_RANGE; P <= P_RANGE; P++) {
            int Rnum = B - a2 * P;
            if (Rnum % a1 != 0) continue;
            int R = Rnum / a1;

            int sigma = C - P * R;
            int disc = sigma * sigma - 4 * a * E;
            if (disc < 0) continue;

            int sqrtDisc = int(round(sqrt(float(disc))));
            if (sqrtDisc * sqrtDisc != disc) continue;

            for (int sgn = -1; sgn <= 1; sgn += 2) {
                int Qnum = sigma + sgn * sqrtDisc;
                if (Qnum % (2 * a2) != 0) continue;
                int Q = Qnum / (2 * a2);
                int Snum = sigma - a2 * Q;
                if (Snum % a1 != 0) continue;
                int S = Snum / a1;

                if (Q * S != E) continue;
                if (P * S + Q * R == D) return true;
            }
        }
    }
    return false;
}

bool isReducible(int a, int B, int C, int D, int E,
                 float p, float q) {
    if (hasRationalRoot(a, B, C, D, E, p, q)) return true;
    if (factorsAsTwoIntegerQuadratics(a, B, C, D, E)) return true;
    return false;
}

// ============================================================
// Line tracing
//
// March along base + t*dir for t in [0, tMax].
// The parameter t is |q|; sign tracks actual sign of q.
// Classify hits by second factor: p²-4q < 0 → biquadratic.
// ============================================================

int traceHalf(vec3 base, vec3 dir, float tMax, float radius,
              int a, int B, float p, float sign) {
    float speed = length(dir);
    float t = 0.0;

    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 pt = base + t * dir;
        float d = sdfLatticeBalls(pt, radius);

        if (d < HIT_THRESHOLD) {
            float q = sign * t;

            if (IRREDUCIBLE_ONLY) {
                ivec3 CDE = ivec3(round(pt));
                if (isReducible(a, B, CDE.x, CDE.y, CDE.z, p, q)) {
                    t += (radius + HIT_THRESHOLD) / speed;
                    continue;
                }
            }

            if (p * p - 4.0 * q < 0.0) return HIT_BIQUADRATIC;
            return HIT_GENERIC;
        }

        t += d / speed;
        if (t > tMax) break;
    }

    return NO_HIT;
}

int traceLine(vec3 base, vec3 dir, float tMax, float radius,
              int a, int B, float p) {
    int result = traceHalf(base,  dir, tMax, radius, a, B, p,  1.0);
    if (result != NO_HIT) return result;
    return   traceHalf(base, -dir, tMax, radius, a, B, p, -1.0);
}

// ============================================================
// Coordinate map
// ============================================================

vec2 pixelToHalfPlane(vec2 fragCoord, vec2 resolution) {
    vec2 uv = fragCoord / resolution;
    float aspect = resolution.x / resolution.y;
    return VIEW_CENTER + (uv - 0.5) * vec2(VIEW_HEIGHT * aspect, VIEW_HEIGHT);
}

// ============================================================
// Main
// ============================================================

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 z = pixelToHalfPlane(fragCoord, iResolution.xy);

    if (z.y <= 0.0) {
        fragColor = vec4(vec3(0.5), 1.0);
        return;
    }

    float s = z.x;
    float n = dot(z, z);

    int result = NO_HIT;
    int hitA = 0;

    // Only positive a: negating a negates all coefficients,
    // which doesn't change the roots of the polynomial.
    for (int a = 1; a <= A_MAX; a++) {
        float fa = float(a);
        vec3 dirA = fa * vec3(1.0, -2.0 * s, n);

        for (int B = B_MIN; B <= B_MAX; B++) {
            float p = (float(B) + 2.0 * fa * s) / fa;
            vec3 base = fa * vec3(n - 2.0 * s * p, n * p, 0.0);

            result = traceLine(base, dirA, Q_MAX, BALL_RADIUS, a, B, p);
            if (result != NO_HIT) { hitA = a; break; }
        }
        if (result != NO_HIT) break;
    }

    vec3 col = vec3(1.0);
    if (result != NO_HIT) {
        float brightness = float(hitA - 1) / float(A_MAX);
        if (result == HIT_BIQUADRATIC) {
            col = mix(vec3(0.2, 0.4, 1.0), vec3(1.0), brightness);
        } else {
            col = vec3(brightness);
        }
    }

    fragColor = vec4(col, 1.0);
}
