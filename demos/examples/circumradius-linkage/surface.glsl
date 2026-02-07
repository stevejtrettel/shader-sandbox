// Implicit Surface Raytracer for Circumradius Linkage
// L1 and L2 parameters come from the params view's mouse position.

// Bounding box in angle space
const vec3 BOX_MIN = vec3(-PI);
const vec3 BOX_MAX = vec3(PI);

// The implicit function F(p) using parameters from the other view
float F(vec3 p, float L1, float L2) {
    vec2 p1 = linkageEndpoint(vec2(1.0, 0.0), L1, p.x);
    vec2 p2 = linkageEndpoint(W, L1, p.y);
    vec2 p3 = linkageEndpoint(W2, L1, p.z);
    return circumradius(p1, p2, p3) - L2;
}

// Gradient of F
vec3 calcGradient(vec3 p, float L1, float L2) {
    const float eps = 0.0005;
    vec2 e = vec2(eps, 0.0);
    return vec3(
        F(p + e.xyy, L1, L2) - F(p - e.xyy, L1, L2),
        F(p + e.yxy, L1, L2) - F(p - e.yxy, L1, L2),
        F(p + e.yyx, L1, L2) - F(p - e.yyx, L1, L2)
    ) / (2.0 * eps);
}

vec3 calcNormal(vec3 p, float L1, float L2) {
    return normalize(calcGradient(p, L1, L2));
}

// Ray-box intersection
bool intersectBox(vec3 ro, vec3 rd, vec3 boxMin, vec3 boxMax,
                  out float tEnter, out float tExit) {
    vec3 invRd = 1.0 / rd;
    vec3 t0 = (boxMin - ro) * invRd;
    vec3 t1 = (boxMax - ro) * invRd;
    vec3 tmin = min(t0, t1);
    vec3 tmax = max(t0, t1);
    tEnter = max(max(tmin.x, tmin.y), tmin.z);
    tExit = min(min(tmax.x, tmax.y), tmax.z);
    return tExit >= max(tEnter, 0.0);
}

// Root refinement using bisection + secant hybrid
float refineRoot(vec3 ro, vec3 rd, float tA, float tB, float L1, float L2) {
    float fA = F(ro + rd * tA, L1, L2);
    float fB = F(ro + rd * tB, L1, L2);

    for (int i = 0; i < 24; i++) {
        float tS = mix(tA, tB, -fA / (fB - fA + 1e-12));
        tS = clamp(tS, min(tA, tB), max(tA, tB));
        float fS = F(ro + rd * tS, L1, L2);

        if (abs(fS) < 1e-7 || abs(tB - tA) < 1e-7) return tS;

        if (sign(fS) == sign(fA)) { tA = tS; fA = fS; }
        else                      { tB = tS; fB = fS; }

        float tM = 0.5 * (tA + tB);
        float fM = F(ro + rd * tM, L1, L2);
        if (sign(fM) != sign(fA)) { tB = tM; fB = fM; }
        else                      { tA = tM; fA = fM; }
    }
    return 0.5 * (tA + tB);
}

// Gradient-based ray marching
float marchGradient(vec3 ro, vec3 rd, float tStart, float tEnd, int maxStepsParam, float L1, float L2) {
    float t = tStart;
    float minStep = (tEnd - tStart) / float(maxStepsParam * 8);
    float maxStep = (tEnd - tStart) / float(maxStepsParam / 4);

    float fPrev = F(ro + rd * t, L1, L2);

    for (int i = 0; i < 2000; i++) {
        if (i >= maxStepsParam) break;

        vec3 p = ro + rd * t;
        float f = fPrev;

        if (abs(f) < 1e-6) return t;

        vec3 grad = calcGradient(p, L1, L2);
        float gradMag = length(grad);
        float dFdt = dot(grad, rd);
        bool nearSingularity = gradMag < 0.1;

        float safeStep;
        if (abs(dFdt) > 0.01) {
            safeStep = abs(f) / abs(dFdt);
        } else if (gradMag > 0.01) {
            safeStep = abs(f) / gradMag;
        } else {
            safeStep = minStep;
        }

        safeStep *= nearSingularity ? 0.5 : 0.8;
        safeStep = clamp(safeStep, minStep, maxStep);

        float tNext = min(t + safeStep, tEnd);

        if (nearSingularity) {
            for (int j = 1; j <= 4; j++) {
                float tSub = mix(t, tNext, float(j) / 4.0);
                float fSub = F(ro + rd * tSub, L1, L2);

                if (sign(f) != sign(fSub)) {
                    float tPrev = mix(t, tNext, float(j - 1) / 4.0);
                    return refineRoot(ro, rd, tPrev, tSub, L1, L2);
                }

                if (abs(fSub) < 0.001 && gradMag < 0.05) {
                    return tSub;
                }
            }
            float fNext = F(ro + rd * tNext, L1, L2);
            fPrev = fNext;
        } else {
            float fNext = F(ro + rd * tNext, L1, L2);

            if (sign(f) != sign(fNext)) {
                return refineRoot(ro, rd, t, tNext, L1, L2);
            }
            fPrev = fNext;
        }

        t = tNext;
        if (t >= tEnd) break;
    }

    return -1.0;
}

// Shading
vec3 shade(vec3 p, vec3 n, vec3 ro) {
    vec3 L1dir = normalize(vec3(0.8, 0.9, 0.2));
    vec3 L2dir = normalize(vec3(-0.6, 0.5, -0.7));

    float amb = 0.25;
    float diff1 = max(dot(n, L1dir), 0.0);
    float diff2 = max(dot(n, L2dir), 0.0);

    vec3 V = normalize(ro - p);
    float spec1 = pow(max(dot(reflect(-L1dir, n), V), 0.0), 32.0);
    float spec2 = pow(max(dot(reflect(-L2dir, n), V), 0.0), 32.0);

    vec3 baseColor = 0.5 + 0.5 * cos(p * 0.5 + vec3(0.0, 2.0, 4.0));

    return amb * baseColor
         + (diff1 + diff2) * baseColor
         + 0.3 * (spec1 + spec2) * vec3(1.0);
}

// Camera with mouse orbit
void setupCamera(out vec3 ro, out vec3 rd, vec2 screenUV, vec4 mouse, vec2 resolution) {
    float rotY = 0.8;
    float rotX = 0.4;

    vec3 boxSize = BOX_MAX - BOX_MIN;
    float zoom = 1.2 * max(boxSize.x, max(boxSize.y, boxSize.z));

    // Use this view's own mouse for camera orbit
    if (mouse.x > 0.0 || mouse.y > 0.0) {
        rotY = -2.0 * PI * mouse.x / resolution.x;
        rotX = -PI * (mouse.y / resolution.y - 0.5);
        rotX = clamp(rotX, -1.5, 1.5);
    }

    vec3 center = 0.5 * (BOX_MIN + BOX_MAX);

    ro = center + vec3(
        zoom * cos(rotY) * cos(rotX),
        zoom * sin(rotX),
        zoom * sin(rotY) * cos(rotX)
    );

    vec3 forward = normalize(center - ro);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up = cross(forward, right);

    rd = normalize(forward + screenUV.x * right + screenUV.y * up);
}

// Cube wireframe
float edgeDistance(vec3 p, vec3 boxMin, vec3 boxMax) {
    vec3 dMin = abs(p - boxMin);
    vec3 dMax = abs(p - boxMax);
    vec3 d = min(dMin, dMax);

    float d0 = min(d.x, min(d.y, d.z));
    float d2 = max(d.x, max(d.y, d.z));
    float d1 = d.x + d.y + d.z - d0 - d2;

    return length(vec2(d0, d1));
}

vec4 cubeWireframe(vec3 ro, vec3 rd, float tEnter, float tExit, float tSurface) {
    float lineWidth = 0.08;
    float alpha = 0.0;

    vec3 pEnter = ro + rd * tEnter;
    float dEnter = edgeDistance(pEnter, BOX_MIN, BOX_MAX);
    alpha = max(alpha, smoothstep(lineWidth, lineWidth * 0.3, dEnter));

    if (tSurface < 0.0 || tSurface > tExit - 0.01) {
        vec3 pExit = ro + rd * tExit;
        float dExit = edgeDistance(pExit, BOX_MIN, BOX_MAX);
        alpha = max(alpha, smoothstep(lineWidth, lineWidth * 0.3, dExit) * 0.4);
    }

    return vec4(vec3(0.4, 0.5, 0.6), alpha * 0.6);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 screenUV = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

    // Get L1, L2 parameters from the params view's mouse position
    vec2 paramsMouseUV = iMouse_params.xy / iResolution_params.xy;

    // Default to interesting parameters if no mouse interaction yet
    if (iMouse_params.x == 0.0 && iMouse_params.y == 0.0) {
        paramsMouseUV = paramsToUV(DEFAULT_PARAMS);
    }

    vec2 params = getParams(paramsMouseUV);
    float L1 = params.x;
    float L2 = params.y;

    vec3 ro, rd;
    setupCamera(ro, rd, screenUV, iMouse_surface, iResolution_surface.xy);

    float t = -1.0;
    float tBoxEnter = -1.0, tBoxExit = -1.0;
    bool hitBox = false;

    if (uCubeView) {
        float tEnter, tExit;
        if (intersectBox(ro, rd, BOX_MIN, BOX_MAX, tEnter, tExit)) {
            hitBox = true;
            tBoxEnter = max(tEnter, 0.0);
            tBoxExit = tExit;
            t = marchGradient(ro, rd, tBoxEnter, tBoxExit, uMaxSteps, L1, L2);
        }
    } else {
        float maxDist = 50.0;
        vec3 oc = ro;
        float b = dot(oc, rd);
        float c = dot(oc, oc) - maxDist * maxDist;
        float disc = b * b - c;

        if (disc > 0.0) {
            float sqrtDisc = sqrt(disc);
            float tStart = max(-b - sqrtDisc, 0.0);
            float tEnd = -b + sqrtDisc;
            if (tEnd > 0.0) {
                t = marchGradient(ro, rd, tStart, tEnd, uMaxSteps, L1, L2);
            }
        }
    }

    vec3 color;
    if (t < 0.0) {
        color = mix(vec3(0.08, 0.09, 0.12), vec3(0.15, 0.18, 0.25),
                    0.5 + 0.5 * screenUV.y);
    } else {
        vec3 p = ro + rd * t;
        vec3 n = calcNormal(p, L1, L2);
        color = shade(p, n, ro);
    }

    if (uCubeView && hitBox) {
        vec4 wire = cubeWireframe(ro, rd, tBoxEnter, tBoxExit, t);
        color = mix(color, wire.rgb, wire.a);
    }

    color = pow(color, vec3(0.4545));

    fragColor = vec4(color, 1.0);
}
