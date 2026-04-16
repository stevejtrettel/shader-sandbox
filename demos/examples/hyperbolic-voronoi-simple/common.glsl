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
