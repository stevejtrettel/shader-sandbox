// Add a Gaussian splat of momentum where the brush drags.

uniform sampler2D field;
uniform vec2 uSplatPos;
uniform vec2 uSplatVel;
uniform float uSplatOn;
uniform float uSplatRadius;
uniform float uSplatForce;

out vec4 fragColor;

void main() {
    vec2 res = vec2(textureSize(field, 0));
    vec2 uv = gl_FragCoord.xy / res;
    vec2 v = texture(field, uv).xy;
    float d = distance(uv, uSplatPos);
    float g = exp(-d * d / (uSplatRadius * uSplatRadius));
    v += uSplatOn * g * uSplatForce * uSplatVel;
    fragColor = vec4(v, 0.0, 1.0);
}
