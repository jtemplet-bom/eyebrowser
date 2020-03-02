#ifdef GL_ES
precision highp float;
#endif

varying vec2 v_rgbNW;
varying vec2 v_rgbNE;
varying vec2 v_rgbSW;
varying vec2 v_rgbSE;
varying vec2 v_rgbM;
varying vec2 v_texCoord;
varying vec2 v_imgCoord;

attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_imageResolution;
uniform vec2 u_resolution;

#pragma glslify: texcoords = require(glsl-fxaa/texcoords.glsl)

void main() {
   //compute the texture coords and store them in varyings
   v_texCoord = a_texCoord; // / u_resolution;
   v_imgCoord = a_texCoord; // / u_imageResolution;
   //v_texCoord = a_texCoord;
   texcoords(v_texCoord, u_resolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
   gl_Position = vec4(a_position, 0.0, 1.0);
}