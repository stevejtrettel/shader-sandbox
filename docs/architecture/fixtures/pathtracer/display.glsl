// Divide the running sum by the per-pixel sample count, tonemap, encode.

uniform sampler2D accum;
uniform vec2 uResolution;

out vec4 fragColor;

void main() {
    vec4 a = texture(accum, gl_FragCoord.xy / uResolution);
    vec3 c = a.rgb / max(a.a, 1.0);
    c = c / (1.0 + c);
    fragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}
