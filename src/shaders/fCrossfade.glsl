#version 300 es

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_image;
uniform sampler2D u_previous;

uniform vec2 resolution;
uniform float u_time;
#define amount 1.0
in vec2 v_texCoord;
out vec4 fragment;
#define tInput u_image
#define tInput2 u_image
#define tFadeMap u_image

void main( void ) {
	//float range = .2;
	vec4 from = texture( u_previous, v_texCoord );
	vec4 to = texture( u_image, v_texCoord );
	//vec3 luma = vec3( .299, 0.587, 0.114 );
	//float v = clamp( dot( luma, texture( u_previous, v_texCoord ).rgb ), 0., 1. - range );
	//float v = clamp( dot( luma, vec3(v_texCoord.x, v_texCoord.y, 1.0 )), 0., 1. - range );
	float time = abs(sin(u_time));
	//float threshold = 0.1;
	//float r = amount * (1.0 + threshold * 2.0) - time;
	//float m = clamp((v - r)*(1.0/threshold), 0.0, 1.0);

	fragment = mix( from, to, time);
	//gl_FragColor = vec4(from.rgb, 1.0);
}