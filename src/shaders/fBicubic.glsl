#ifdef GL_ES
precision highp float;
#endif

varying vec2 v_texCoord;

uniform sampler2D u_image;
uniform vec2 u_imageResolution;
uniform vec2 u_resolution;

float BSpline(float x)
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

float Triangular( float f )
{
	f = f / 2.0;
	if( f < 0.0 )
	{
		return ( f + 1.0 );
	}
	else
	{
		return ( 1.0 - f );
	}
	return 0.0;
}

float BellFunc( float x )
{
	float f = ( x / 2.0 ) * 1.5; // Converting -2 to +2 to -1.5 to +1.5
	if( f > -1.5 && f < -0.5 )
	{
		return( 0.5 * pow(f + 1.5, 2.0));
	}
	else if( f > -0.5 && f < 0.5 )
	{
		return 3.0 / 4.0 - ( f * f );
	}
	else if( ( f > 0.5 && f < 1.5 ) )
	{
		return( 0.5 * pow(f - 1.5, 2.0));
	}
	return 0.0;
}

const vec4 offset = vec4(-1.0, 1.0, 1.0 ,-1.0);

vec4 filter(sampler2D tex, vec2 v_texCoord)
{
	float fx = fract(v_texCoord.x);
	float fy = fract(v_texCoord.y);
	v_texCoord.x -= fx;
	v_texCoord.y -= fy;

	vec4 xcubic = vec4(Triangular(-1. - fx), Triangular(-fx), Triangular(1. - fx), Triangular(2. - fx));
	vec4 ycubic = vec4(Triangular(-1. - fy), Triangular(-fy), Triangular(1. - fy), Triangular(2. - fy));

	vec4 c = vec4(v_texCoord.x - 0.5, v_texCoord.x + 1.5, v_texCoord.y - 0.5, v_texCoord.y + 1.5);
	vec4 s = vec4(xcubic.x + xcubic.y, xcubic.z + xcubic.w, ycubic.x + ycubic.y, ycubic.z + ycubic.w);
	vec4 offset = c + vec4(xcubic.y, xcubic.w, ycubic.y, ycubic.w) / s;

	vec4 sample0 = texture2D(tex, vec2(offset.x, offset.z) / u_imageResolution);
	vec4 sample1 = texture2D(tex, vec2(offset.y, offset.z) / u_imageResolution);
	vec4 sample2 = texture2D(tex, vec2(offset.x, offset.w) / u_imageResolution);
	vec4 sample3 = texture2D(tex, vec2(offset.y, offset.w) / u_imageResolution);

	float sx = s.x / (s.x + s.y);
	float sy = s.z / (s.z + s.w);

	return mix(mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);
}

void main() {
   gl_FragColor = filter(u_image, v_texCoord * u_imageResolution);
}