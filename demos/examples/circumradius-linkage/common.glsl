/**
 * COMMON - Implicit Function Definition for Circumradius Linkage
 *
 * The surface is rendered where F(p) = 0.
 * F(p) = circumradius(p1, p2, p3) - L2
 * where each point pi is a linkage endpoint computed from angles p.x, p.y, p.z
 */

const float PI = 3.14159265359;

// Complex Number Utils
vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cexp(float theta) {
    return vec2(cos(theta), sin(theta));
}

// Triangle Math
float triangleArea(vec2 a, vec2 b, vec2 c) {
    vec2 ab = b - a;
    vec2 ac = c - a;
    return 0.5 * abs(ab.x * ac.y - ab.y * ac.x);
}

float circumradius(vec2 a, vec2 b, vec2 c) {
    float sideA = length(b - c);
    float sideB = length(a - c);
    float sideC = length(a - b);
    float area = triangleArea(a, b, c);
    if (area < 1e-10) return 1e10;
    return (sideA * sideB * sideC) / (4.0 * area);
}

// Building the Points from the Linkage
// omega = e^(2*pi*i/3), the cube root of unity
const vec2 W = vec2(-0.5, 0.866025403784439);   // omega
const vec2 W2 = vec2(-0.5, -0.866025403784439); // omega^2

vec2 linkageEndpoint(vec2 base, float L, float t) {
    return cmul(base, vec2(1.0, 0.0) - L * cexp(t));
}

// Map mouse UV to parameter values (always positive)
// L1: 0.01 to 0.5, L2: 0.1 to 3.0
vec2 getParams(vec2 mouseUV) {
    float L1 = mix(0.01, 0.5, mouseUV.x);
    float L2 = mix(0.1, 3.0, mouseUV.y);
    return vec2(L1, L2);
}

// Inverse: convert params back to UV
vec2 paramsToUV(vec2 params) {
    float uvX = (params.x - 0.01) / (0.5 - 0.01);
    float uvY = (params.y - 0.1) / (3.0 - 0.1);
    return vec2(uvX, uvY);
}

// Default parameters
const vec2 DEFAULT_PARAMS = vec2(0.2, 1.0); // L1, L2
