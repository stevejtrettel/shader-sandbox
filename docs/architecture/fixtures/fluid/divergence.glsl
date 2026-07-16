// Central-difference divergence of velocity. Clamped fetches give
// zero-gradient boundaries.

uniform sampler2D vel;

out vec4 fragColor;

void main() {
    ivec2 q = ivec2(gl_FragCoord.xy);
    ivec2 sz = textureSize(vel, 0);
    float l = texelFetch(vel, clamp(q + ivec2(-1, 0), ivec2(0), sz - 1), 0).x;
    float r = texelFetch(vel, clamp(q + ivec2( 1, 0), ivec2(0), sz - 1), 0).x;
    float b = texelFetch(vel, clamp(q + ivec2( 0,-1), ivec2(0), sz - 1), 0).y;
    float t = texelFetch(vel, clamp(q + ivec2( 0, 1), ivec2(0), sz - 1), 0).y;
    fragColor = vec4(0.5 * ((r - l) + (t - b)), 0.0, 0.0, 1.0);
}
