export const vSampleTexture = `
#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;


void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}
`

export const fPassthrough = `
#ifdef GL_ES
precision mediump float;
#endif
varying vec2 v_texCoord;
uniform sampler2D u_image;

void main(){
    gl_FragColor = texture2D(u_image, v_texCoord);
}
`

export const vhs = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_buffer0;
uniform sampler2D u_video;
uniform vec2 u_videoResolution;

vec3 mod289(vec3 x) {
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
	return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v) {
	const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
						0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
					   -0.577350269189626,  // -1.0 + 2.0 * C.x
						0.024390243902439); // 1.0 / 41.0
	vec2 i  = floor(v + dot(v, C.yy) );
	vec2 x0 = v -   i + dot(i, C.xx);

	vec2 i1;
	i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
	vec4 x12 = x0.xyxy + C.xxzz;
	x12.xy -= i1;

	i = mod289(i); // Avoid truncation effects in permutation
	vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		  + i.x + vec3(0.0, i1.x, 1.0 ));

	vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
	m = m*m ;
	m = m*m ;

	vec3 x = 2.0 * fract(p * C.www) - 1.0;
	vec3 h = abs(x) - 0.5;
	vec3 ox = floor(x + 0.5);
	vec3 a0 = x - ox;

	m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

	vec3 g;
	g.x  = a0.x  * x0.x  + h.x  * x0.y;
	g.yz = a0.yz * x12.xz + h.yz * x12.yw;
	return 130.0 * dot(m, g);
}

float rand(vec2 co) {
	return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453);
}

#if defined(BUFFER_0)

void main() {
	vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float time = u_time * 2.0;

    float noise = max(0.0, snoise(vec2(time, uv.y * 0.3)) - 0.3) * (1.0 / 0.7);
    noise = noise + (snoise(vec2(time*10.0, uv.y * 2.4)) - 0.5) * 0.15;
    float xpos = uv.x - noise * noise * 0.25;
	vec4 color = texture2D(u_video, vec2(xpos, uv.y));
    color.rgb = mix(color.rgb, vec3(rand(vec2(uv.y * time))), noise * 0.3).rgb;

    if (floor(mod(gl_FragCoord.y * 0.25, 2.0)) == 0.0) {
        color.rgb *= 1.0 - (0.15 * noise);
    }

    color.g = mix(color.r, texture2D(u_buffer0, vec2(xpos + noise * 0.05, uv.y)).g, 0.25);
	color.b = mix(color.r, texture2D(u_buffer0, vec2(xpos - noise * 0.05, uv.y)).b, 0.25);

	gl_FragColor = color;
}

#else

void main() {
	vec2 st = gl_FragCoord.xy / u_resolution.xy;
	vec3 color = texture2D(u_buffer0, st).rgb;
	gl_FragColor = vec4(vec3(color.r), 1.0);
}

#endif
`

export const simpleNoise = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

// Some useful functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

//
// Description : GLSL 2D simplex noise function
//      Author : Ian McEwan, Ashima Arts
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License :
//  Copyright (C) 2011 Ashima Arts. All rights reserved.
//  Distributed under the MIT License. See LICENSE file.
//  https://github.com/ashima/webgl-noise
//
float snoise(vec2 v) {

    // Precompute values for skewed triangular grid
    const vec4 C = vec4(0.211324865405187,
                        // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,
                        // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626,
                        // -1.0 + 2.0 * C.x
                        0.024390243902439);
                        // 1.0 / 41.0

    // First corner (x0)
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    // Other two corners (x1, x2)
    vec2 i1 = vec2(0.0);
    i1 = (x0.x > x0.y)? vec2(1.0, 0.0):vec2(0.0, 1.0);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;

    // Do some permutations to avoid
    // truncation effects in permutation
    i = mod289(i);
    vec3 p = permute(
            permute( i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0 ));

    vec3 m = max(0.5 - vec3(
                        dot(x0,x0),
                        dot(x1,x1),
                        dot(x2,x2)
                        ), 0.0);

    m = m*m ;
    m = m*m ;

    // Gradients:
    //  41 pts uniformly over a line, mapped onto a diamond
    //  The ring size 17*17 = 289 is close to a multiple
    //      of 41 (41*7 = 287)

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    // Normalise gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt(a0*a0 + h*h);
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);

    // Compute final noise value at P
    vec3 g = vec3(0.0);
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
    return 130.0 * dot(m, g);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;

    vec3 color = vec3(0.0);

    // Scale the space in order to see the function
    st *= 10.;

    color = vec3(snoise(st)*.5+.5);

    gl_FragColor = vec4(color,1.0);
}
`

export const interpolateBicubic = `
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D texture;
uniform vec2 size;
varying vec2 v_texCoord;
float BSpline( float x )
{
	float f = abs(x);

	if(f <= 1.0 )
		return (( 2.0 / 3.0 ) + ( 0.5 ) * ( f * f * f ) - (f * f));
	else
	{
		f = 2.0 - f;
		return (1.0 / 6.0 * f * f * f);
	}
}
const vec4 offset = vec4(-1.0, 1.0, 1.0 ,-1.0);

vec4 filter(sampler2D tex, vec2 v_texCoord)
{
	float fx = fract(v_texCoord.x);
	float fy = fract(v_texCoord.y);
	v_texCoord.x -= fx;
	v_texCoord.y -= fy;

	vec4 xcubic = vec4(BSpline(- 1 - fx), BSpline(-fx), BSpline(1 - fx), BSpline(2 - fx));
	vec4 ycubic = vec4(BSpline(- 1 - fy), BSpline(-fy), BSpline(1 - fy), BSpline(2 - fy));

	vec4 c = vec4(v_texCoord.x - 0.5, v_texCoord.x + 1.5, v_texCoord.y - 0.5, v_texCoord.y + 1.5);
	vec4 s = vec4(xcubic.x + xcubic.y, xcubic.z + xcubic.w, ycubic.x + ycubic.y, ycubic.z + ycubic.w);
	vec4 offset = c + vec4(xcubic.y, xcubic.w, ycubic.y, ycubic.w) / s;

	vec4 sample0 = texture2D(tex, vec2(offset.x, offset.z) / size);
	vec4 sample1 = texture2D(tex, vec2(offset.y, offset.z) / size);
	vec4 sample2 = texture2D(tex, vec2(offset.x, offset.w) / size);
	vec4 sample3 = texture2D(tex, vec2(offset.y, offset.w) / size);

	float sx = s.x / (s.x + s.y);
	float sy = s.z / (s.z + s.w);

	return mix(mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);
}

void main() {
   gl_FragColor = filter(texture, v_texCoord * size);
}
`

export const fFXAA = `
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_image;

// The inverse of the texture dimensions along X and Y
uniform vec2 size;
varying vec2 v_texCoord;

void main() {
  // The parameters are hardcoded for now, but could be
  // made into uniforms to control fromt he program.
  float FXAA_SPAN_MAX = 3.0;
  float FXAA_REDUCE_MUL = 1.0/4.0;
  float FXAA_REDUCE_MIN = (1.0/128.0);

  vec3 rgbNW = texture2D(u_image, v_texCoord + (vec2(-1.0, -1.0) * size)).xyz;
  vec3 rgbNE = texture2D(u_image, v_texCoord + (vec2(+1.0, -1.0) * size)).xyz;
  vec3 rgbSW = texture2D(u_image, v_texCoord + (vec2(-1.0, +1.0) * size)).xyz;
  vec3 rgbSE = texture2D(u_image, v_texCoord + (vec2(+1.0, +1.0) * size)).xyz;
  vec4 rgbM  = texture2D(u_image, v_texCoord);

  vec3 luma = vec3(0.299, 0.587, 0.114);
  float lumaNW = dot(rgbNW, luma);
  float lumaNE = dot(rgbNE, luma);
  float lumaSW = dot(rgbSW, luma);
  float lumaSE = dot(rgbSE, luma);
  float lumaM = dot(rgbM.xyz, luma);

  float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
  float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

  vec2 dir;
  dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
  dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

  float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);

  float rcpDirMin = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);

  dir = min(vec2(FXAA_SPAN_MAX,  FXAA_SPAN_MAX),
        max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * rcpDirMin)) * size;

  vec3 rgbA = (1.0/2.0) * (
              texture2D(u_image, v_texCoord + dir * (1.0/3.0 - 0.5)).xyz +
              texture2D(u_image, v_texCoord + dir * (2.0/3.0 - 0.5)).xyz);
  vec3 rgbB = rgbA * (1.0/2.0) + (1.0/4.0) * (
              texture2D(u_image, v_texCoord + dir * (0.0/3.0 - 0.5)).xyz +
              texture2D(u_image, v_texCoord + dir * (3.0/3.0 - 0.5)).xyz);
  float lumaB = dot(rgbB, luma);

  if((lumaB < lumaMin) || (lumaB > lumaMax)){
    gl_FragColor.xyz=rgbA;
  } else {
    gl_FragColor.xyz=rgbB;
  }
  gl_FragColor.a = 1.0;
}`
