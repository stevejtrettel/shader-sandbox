// Deposit dye under the brush.

uniform sampler2D field;
uniform vec2 uSplatPos;
uniform float uSplatOn;
uniform float uSplatRadius;
uniform vec3 uDyeColor;

out vec4 fragColor;

void main() {
    vec2 res = vec2(textureSize(field, 0));
    vec2 uv = gl_FragCoord.xy / res;
    vec4 c = texture(field, uv);
    float d = distance(uv, uSplatPos);
    float g = exp(-d * d / (uSplatRadius * uSplatRadius));
    c.rgb += uSplatOn * g * uDyeColor;
    fragColor = c;
}
