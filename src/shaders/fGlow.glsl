#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D u_image;
uniform vec2 u_imageResolution;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

float bloom_spread = 1.0;
float bloom_intensity = 2.0;

void main() {
    vec4 pixel = texture2D(u_image, v_texCoord);

    vec2 size = u_imageResolution;
    vec2 uv = v_texCoord * size;

    vec4 sum = vec4(0.0);
    for (int n = 0; n < 9; ++n) {
        uv.y = (v_texCoord.y * size.y) + (bloom_spread * float(n - 4));
        vec4 h_sum = vec4(0.0);
        h_sum += texture2D(u_image, vec2(uv.x - (3.0 * bloom_spread), uv.y));
        h_sum += texture2D(u_image, vec2(uv.x - (2.0 * bloom_spread), uv.y));
        h_sum += texture2D(u_image, vec2(uv.x - bloom_spread, uv.y));
        h_sum += texture2D(u_image, uv);
        h_sum += texture2D(u_image, vec2(uv.x + bloom_spread, uv.y));
        h_sum += texture2D(u_image, vec2(uv.x + (2.0 * bloom_spread), uv.y));
        h_sum += texture2D(u_image, vec2(uv.x + (3.0 * bloom_spread), uv.y));
        h_sum += texture2D(u_image, vec2(uv.x + (4.0 * bloom_spread), uv.y));
        h_sum += texture2D(u_image, vec2(uv.x - (4.0 * bloom_spread), uv.y));
        sum += h_sum / 9.0;
    }

    pixel.a = 1.0;
    pixel.rgb = texture2D(u_image, v_texCoord).rgb - ((sum / 9.0) * bloom_intensity).rgb;
    gl_FragColor = pixel;
}