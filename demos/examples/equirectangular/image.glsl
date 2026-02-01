// Equirectangular Demo
// Renders a spinning environment sphere using an equirectangular texture

#define PI 3.14159265359

vec2 dirToEquirect(vec3 dir) {
    float lon = atan(dir.z, dir.x);
    float lat = asin(clamp(dir.y, -1.0, 1.0));
    return vec2(lon / (2.0 * PI) + 0.5, lat / PI + 0.5);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    // Camera ray
    vec3 rd = normalize(vec3(uv, 1.0));

    // Rotate camera over time
    float a = iTime * 0.3;
    float c = cos(a), s = sin(a);
    rd = vec3(c * rd.x + s * rd.z, rd.y, -s * rd.x + c * rd.z);

    // Look up equirectangular texture
    vec2 tc = dirToEquirect(rd);
    vec3 col = texture(envMap, tc).rgb;

    fragColor = vec4(col, 1.0);
}
