
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_image;
uniform sampler2D tInput2;
uniform sampler2D tFadeMap;
uniform vec2 resolution;
uniform float time;
uniform float amount;

varying vec2 v_texCoord;

void main( void ) {

	float range = .2;
	vec4 from = texture2D( tInput, v_texCoord );
	vec4 to = texture2D( tInput2, v_texCoord );
	vec3 luma = vec3( .299, 0.587, 0.114 );
	float v = clamp( dot( luma, texture2D( tFadeMap, v_texCoord ).rgb ), 0., 1. - range );

	float threshold = 0.1;
	float r = amount * (1.0 + threshold * 2.0) - threshold;
	float m = clamp((v - r)*(1.0/threshold), 0.0, 1.0);

	gl_FragColor = mix( from, to, m );

}