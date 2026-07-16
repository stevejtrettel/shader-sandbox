// Semi-Lagrangian advection. Instantiated twice: (vel,src)=(velocity,velocity)
// advects velocity through itself; (velocity,dye) carries dye along.
// Velocity is stored in uv-units per second so the same shader serves both
// grid resolutions.

uniform sampler2D vel;
uniform sampler2D src;
uniform float uDt;

out vec4 fragColor;

void main() {
    vec2 res = vec2(textureSize(src, 0));
    vec2 uv = gl_FragCoord.xy / res;
    vec2 v = texture(vel, uv).xy;
    fragColor = texture(src, uv - uDt * v);
}
