// Diagnostic view: diverging blue-white-red colormap of remaining
// divergence. (Candidate for replacement by the built-in false-color
// inspector once diagnostics exist.)

uniform sampler2D div;
uniform vec2 uResolution;

out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    float d = texture(div, uv).x * 20.0;
    vec3 c = d > 0.0
        ? mix(vec3(1.0), vec3(0.85, 0.15, 0.10), clamp( d, 0.0, 1.0))
        : mix(vec3(1.0), vec3(0.10, 0.30, 0.85), clamp(-d, 0.0, 1.0));
    fragColor = vec4(c, 1.0);
}
