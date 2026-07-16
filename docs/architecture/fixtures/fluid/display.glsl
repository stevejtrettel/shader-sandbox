// Main view: dye field to screen.

uniform sampler2D dye;
uniform vec2 uResolution;

out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec3 c = texture(dye, uv).rgb;
    fragColor = vec4(c / (1.0 + 0.15 * c), 1.0);
}
