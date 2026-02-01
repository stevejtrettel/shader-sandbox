// common.glsl - Shared code available to ALL passes
// These functions can be used in any pass without redeclaring them

#define PI 3.14159265359

// Color palette function (attempt Inigo Quilez)
vec3 palette(float t) {
    vec3 a = vec3(0.5);
    vec3 b = vec3(0.5);
    vec3 c = vec3(1.0);
    vec3 d = vec3(0.0, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
}

// Simple 2D rotation matrix
mat2 rot2D(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}
