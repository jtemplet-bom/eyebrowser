#version 300 es

#ifdef GL_ES
precision mediump float;
#endif

void main() {
    gl_Position = vec4( position, 1.0 );
}