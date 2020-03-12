#version 300 es

#ifdef GL_ES
precision mediump float;
#endif

in vec4 a_position;
in vec2 a_texCoord;
// out vec4 v_color;
out vec2 v_texCoord;

uniform vec2 u_resolution;

void main() {
    v_texCoord = a_texCoord;
    gl_Position = a_position;
}