// Subtract the pressure gradient to make velocity divergence-free.

uniform sampler2D p;
uniform sampler2D vel;

out vec4 fragColor;

void main() {
    ivec2 q = ivec2(gl_FragCoord.xy);
    ivec2 sz = textureSize(p, 0);
    float l = texelFetch(p, clamp(q + ivec2(-1, 0), ivec2(0), sz - 1), 0).x;
    float r = texelFetch(p, clamp(q + ivec2( 1, 0), ivec2(0), sz - 1), 0).x;
    float b = texelFetch(p, clamp(q + ivec2( 0,-1), ivec2(0), sz - 1), 0).x;
    float t = texelFetch(p, clamp(q + ivec2( 0, 1), ivec2(0), sz - 1), 0).x;
    vec2 v = texelFetch(vel, q, 0).xy;
    v -= 0.5 * vec2(r - l, t - b);
    fragColor = vec4(v, 0.0, 1.0);
}
