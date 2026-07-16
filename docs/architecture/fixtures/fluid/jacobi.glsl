// One Jacobi relaxation iteration for the pressure Poisson equation.
// The schedule runs this pass in a `repeat` block; each iteration reads
// the pressure committed by the previous one.

uniform sampler2D p;
uniform sampler2D div;

out vec4 fragColor;

void main() {
    ivec2 q = ivec2(gl_FragCoord.xy);
    ivec2 sz = textureSize(p, 0);
    float l = texelFetch(p, clamp(q + ivec2(-1, 0), ivec2(0), sz - 1), 0).x;
    float r = texelFetch(p, clamp(q + ivec2( 1, 0), ivec2(0), sz - 1), 0).x;
    float b = texelFetch(p, clamp(q + ivec2( 0,-1), ivec2(0), sz - 1), 0).x;
    float t = texelFetch(p, clamp(q + ivec2( 0, 1), ivec2(0), sz - 1), 0).x;
    float d = texelFetch(div, q, 0).x;
    fragColor = vec4(0.25 * (l + r + b + t - d), 0.0, 0.0, 1.0);
}
