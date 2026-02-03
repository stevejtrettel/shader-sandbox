// 3x3 Laplacian with diagonal weights
float lap(sampler2D tex, vec2 uv, vec2 dx) {
    float sum = 0.0;
    sum += texture(tex, uv + vec2(-dx.x, -dx.y)).r * 0.05;
    sum += texture(tex, uv + vec2(  0.0, -dx.y)).r * 0.2;
    sum += texture(tex, uv + vec2( dx.x, -dx.y)).r * 0.05;
    sum += texture(tex, uv + vec2(-dx.x,   0.0)).r * 0.2;
    sum += texture(tex, uv                      ).r * -1.0;
    sum += texture(tex, uv + vec2( dx.x,   0.0)).r * 0.2;
    sum += texture(tex, uv + vec2(-dx.x,  dx.y)).r * 0.05;
    sum += texture(tex, uv + vec2(  0.0,  dx.y)).r * 0.2;
    sum += texture(tex, uv + vec2( dx.x,  dx.y)).r * 0.05;
    return sum;
}
