// =============================================
// Complex Arithmetic
// =============================================
// We represent complex numbers as vec2: (real, imaginary).

vec2 cconj(vec2 z) {
    return vec2(z.x, -z.y);
}

vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
    return cmul(a, cconj(b)) / dot(b, b);
}

// Complex hyperbolic tangent:
//     tanh(u + iv) = (sinh(2u) + i sin(2v)) / (cosh(2u) + cos(2v))
vec2 ctanh(vec2 z) {
    float denom = cosh(2.0 * z.x) + cos(2.0 * z.y);
    return vec2(sinh(2.0 * z.x), sin(2.0 * z.y)) / denom;
}


// =============================================
// Hyperbolic Geometry
// =============================================
// We compute on the hyperboloid model: the upper sheet of
//     x² + y² - z² = -1,   z > 0
// and display in the Poincaré disk model.

// Minkowski inner product with signature (+, +, -)
float minkowski(vec3 a, vec3 b) {
    return a.x * b.x + a.y * b.y - a.z * b.z;
}

// Hyperbolic distance between two points on the hyperboloid.
// By the hyperboloid model, cosh(d) = -<a, b> where <,> is the
// Minkowski inner product. The max(..., 1.0) clamps floating-point
// error so that identical points yield distance 0.
float hypDist(vec3 a, vec3 b) {
    return acosh(max(-minkowski(a, b), 1.0));
}

// Map from the Poincaré disk to the hyperboloid.
// Given a point p in the open unit disk, its image on the
// hyperboloid is ((2p)/(1-|p|²), (1+|p|²)/(1-|p|²)).
vec3 diskToHyperboloid(vec2 p) {
    float r2 = dot(p, p);
    float denom = 1.0 - r2;
    return vec3(2.0 * p / denom, (1.0 + r2) / denom);
}

// Map from the hyperboloid to the Poincaré disk.
// This is the inverse of diskToHyperboloid: stereographic
// projection from (0, 0, -1) onto the z = 0 plane.
vec2 hyperboloidToDisk(vec3 h) {
    return h.xy / (1.0 + h.z);
}

// Map from the band model to the Poincaré disk.
// The band model is the infinite strip { w : |Im(w)| < π/2 }.
// The conformal map is z = tanh(w).
vec2 bandToDisk(vec2 w) {
    return ctanh(w);
}

// Map from the Poincaré disk to the band model.
// This is the inverse: w = arctanh(z) = (1/2) log((1+z)/(1-z)).
// We compute it via the real formula for arctanh of a complex number.
vec2 diskToBand(vec2 z) {
    // arctanh(z) = (1/2)(ln|1+z| - ln|1-z|) + (i/2)(arg(1+z) - arg(1-z))
    vec2 onePlusZ = vec2(1.0 + z.x, z.y);
    vec2 oneMinusZ = vec2(1.0 - z.x, -z.y);
    float re = 0.5 * log(dot(onePlusZ, onePlusZ) / dot(oneMinusZ, oneMinusZ));
    float im = 0.5 * (atan(onePlusZ.y, onePlusZ.x) - atan(oneMinusZ.y, oneMinusZ.x));
    return vec2(re, im);
}

// Möbius translation in the Poincaré disk:
//     T_a(z) = (z + a) / (1 + conj(a) * z)
// This is a hyperbolic isometry that maps the origin to a
// and preserves the unit disk.
vec2 mobiusTranslate(vec2 z, vec2 a) {
    vec2 num = z + a;
    vec2 den = vec2(1.0, 0.0) + cmul(cconj(a), z);
    return cdiv(num, den);
}
