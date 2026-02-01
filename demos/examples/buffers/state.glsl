float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    if (iFrame == 0) {
        float random = hash(fragCoord);
        fragColor = vec4(step(0.5, random));
        return;
    }

    ivec2 p = ivec2(fragCoord);

    float self = texelFetch(state, p, 0).r;
    float neighbors =
        texelFetch(state, p + ivec2(-1, -1), 0).r +
        texelFetch(state, p + ivec2( 0, -1), 0).r +
        texelFetch(state, p + ivec2( 1, -1), 0).r +
        texelFetch(state, p + ivec2(-1,  0), 0).r +
        texelFetch(state, p + ivec2( 1,  0), 0).r +
        texelFetch(state, p + ivec2(-1,  1), 0).r +
        texelFetch(state, p + ivec2( 0,  1), 0).r +
        texelFetch(state, p + ivec2( 1,  1), 0).r;

    float alive = 0.0;
    if (self == 1.0) {
        if (neighbors == 2.0 || neighbors == 3.0) {
            alive = 1.0;
        }
    } else {
        if (neighbors == 3.0) {
            alive = 1.0;
        }
    }

    fragColor = vec4(vec3(alive), 1.0);
}
