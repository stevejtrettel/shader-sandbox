// One progressive sample per pixel per simulation step.
// Radiance sum accumulates in rgb; the pixel's own sample count lives in
// alpha, which also seeds the RNG — so accumulation is deterministic and
// self-contained, and `resetOn` clearing the texture restarts both.

uniform sampler2D accum;
uniform vec2 uResolution;
uniform vec3 uCamPos;
uniform vec3 uCamTarget;
uniform float uFov;
uniform vec3 uAlbedo;
uniform float uRoughness;
uniform float uLightIntensity;

out vec4 fragColor;

uint rngState;

uint pcgHash(uint v) {
    uint s = v * 747796405u + 2891336453u;
    uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
    return (w >> 22u) ^ w;
}

float rand() {
    rngState = pcgHash(rngState);
    return float(rngState) / 4294967296.0;
}

struct Hit { float t; vec3 n; vec3 albedo; float rough; vec3 emit; };

bool sphere(vec3 ro, vec3 rd, vec3 c, float r, inout float t, out vec3 n) {
    vec3 oc = ro - c;
    float b = dot(oc, rd);
    float h = b * b - (dot(oc, oc) - r * r);
    n = vec3(0.0);
    if (h < 0.0) return false;
    float s = -b - sqrt(h);
    if (s < 1e-3 || s > t) return false;
    t = s;
    n = normalize(ro + s * rd - c);
    return true;
}

Hit intersect(vec3 ro, vec3 rd) {
    Hit h;
    h.t = 1e9; h.n = vec3(0.0); h.albedo = vec3(0.0); h.rough = 1.0; h.emit = vec3(0.0);
    vec3 n;

    // checkered ground plane y = 0
    if (rd.y < 0.0) {
        float s = -ro.y / rd.y;
        if (s > 1e-3 && s < h.t) {
            h.t = s; h.n = vec3(0.0, 1.0, 0.0);
            vec3 q = ro + s * rd;
            float check = mod(floor(q.x) + floor(q.z), 2.0);
            h.albedo = mix(vec3(0.8), vec3(0.3), check);
            h.rough = 1.0; h.emit = vec3(0.0);
        }
    }

    if (sphere(ro, rd, vec3(0.0, 1.0, 0.0), 1.0, h.t, n))
        { h.n = n; h.albedo = uAlbedo; h.rough = uRoughness; h.emit = vec3(0.0); }
    if (sphere(ro, rd, vec3(-2.2, 0.7, 0.8), 0.7, h.t, n))
        { h.n = n; h.albedo = vec3(0.9); h.rough = 0.05; h.emit = vec3(0.0); }
    if (sphere(ro, rd, vec3(1.9, 0.5, -1.1), 0.5, h.t, n))
        { h.n = n; h.albedo = vec3(0.4, 0.6, 0.9); h.rough = 0.4; h.emit = vec3(0.0); }
    if (sphere(ro, rd, vec3(0.0, 4.5, 0.0), 1.2, h.t, n))
        { h.n = n; h.albedo = vec3(0.0); h.rough = 1.0; h.emit = vec3(uLightIntensity); }

    return h;
}

vec3 cosineDir(vec3 n) {
    float a = 6.2831853 * rand();
    float z = rand();
    float r = sqrt(z);
    vec3 t = normalize(abs(n.x) < 0.5 ? cross(n, vec3(1.0, 0.0, 0.0))
                                      : cross(n, vec3(0.0, 1.0, 0.0)));
    vec3 b = cross(n, t);
    return normalize(t * (r * cos(a)) + b * (r * sin(a)) + n * sqrt(1.0 - z));
}

void main() {
    ivec2 px = ivec2(gl_FragCoord.xy);
    vec4 prev = texelFetch(accum, px, 0);

    rngState = pcgHash(uint(px.x) ^ pcgHash(uint(px.y) ^ pcgHash(uint(prev.a))));

    vec3 fwd = normalize(uCamTarget - uCamPos);
    vec3 rgt = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(rgt, fwd);
    vec2 jitter = vec2(rand(), rand()) - 0.5;
    vec2 uv = (gl_FragCoord.xy + jitter - 0.5 * uResolution) / uResolution.y;
    float focal = 0.5 / tan(radians(uFov) * 0.5);
    vec3 rd = normalize(uv.x * rgt + uv.y * up + focal * fwd);
    vec3 ro = uCamPos;

    vec3 radiance = vec3(0.0);
    vec3 throughput = vec3(1.0);

    for (int bounce = 0; bounce < 5; bounce++) {
        Hit h = intersect(ro, rd);
        if (h.t > 1e8) { radiance += throughput * vec3(0.02, 0.03, 0.05); break; }

        radiance += throughput * h.emit;
        throughput *= h.albedo;

        ro = ro + h.t * rd + 1e-3 * h.n;
        vec3 diff = cosineDir(h.n);
        vec3 spec = reflect(rd, h.n);
        // crude glossy: unnormalized lerp between mirror and cosine lobes
        rd = normalize(mix(spec, diff, h.rough * h.rough));
        if (dot(rd, h.n) <= 0.0) rd = diff;

        if (bounce > 1) {
            float q = max(throughput.r, max(throughput.g, throughput.b));
            if (rand() > q) break;
            throughput /= q;
        }
    }

    fragColor = vec4(prev.rgb + radiance, prev.a + 1.0);
}
