#version 300 es

#ifdef GL_ES
precision highp float;
#endif

in vec2 v_texCoord;
uniform sampler2D u_image;
out vec4 fragColor;

void main(){
    fragColor = texture(u_image, v_texCoord);
}