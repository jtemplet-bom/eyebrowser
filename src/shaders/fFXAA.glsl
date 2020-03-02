#ifdef GL_ES
precision highp float;
#endif

#define FXAA_REDUCE_MIN   (1.0 / 512.0)
#define FXAA_REDUCE_MUL   (1.0 / 16.0)
#define FXAA_SPAN_MAX     16.0


varying vec2 v_rgbNW;
varying vec2 v_rgbNE;
varying vec2 v_rgbSW;
varying vec2 v_rgbSE;
varying vec2 v_rgbM;
varying vec2 v_texCoord;

uniform sampler2D u_image;
uniform vec2 u_imageResolution;
uniform vec2 u_resolution;

#pragma glslify: fxaa = require(glsl-fxaa/fxaa.glsl)

void main() {
    vec2 fragCoord = v_texCoord * u_resolution;

    gl_FragColor = fxaa(u_image, fragCoord, u_resolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
}
