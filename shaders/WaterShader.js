import {
	Vector2
} from "../../three.js-123/build/three.module.js";

const WaterShader = () => {
	console.log(innerWidth + '/' + innerHeight)
	return  {
		uniforms:{
			iChannel0:{type:'t', value:null },
			iChannel1:{type:'t', value:null },
			iTime:{type:'f', value:0.0},
			iDarkFactor:{type:'f', value:0.0},
			iResolution:{type:'v2', value:new THREE.Vector2(980, 1659)}
		},
		vertexShader:`
			varying vec2 vUv;

			void main(){
				vUv = uv;

				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader:`
			varying vec2 vUv;

			uniform float iDarkFactor;

			uniform sampler2D iChannel0;
			uniform sampler2D iChannel1;
			uniform vec2 iResolution;
			uniform float iTime;

			float hash(vec2 p) {
				return 0.5*(
			    sin(dot(p, vec2(271.319, 413.975)) + 1217.13*p.x*p.y)
			    ) + 0.5;
			}

			float noise(vec2 p) {
			  vec2 w = fract(p);
			  w = w * w * (3.0 - 2.0*w);
			  p = floor(p);
			  return mix(
			    mix(hash(p+vec2(0,0)), hash(p+vec2(1,0)), w.x),
			    mix(hash(p+vec2(0,1)), hash(p+vec2(1,1)), w.x), w.y);
			}

			float fbm(vec2 n) {
				float total = 0.0, amplitude = 1.0;
				for (int i = 0; i < 5; i++) {
					total += noise(n) * amplitude; 
					n += n;
					amplitude *= 0.4; 
				}
				return total;
			}

			float timeSpeed = 2.0;

			float randomVal (float inVal){
			    return fract(sin(dot(vec2(inVal, 2523.2361) ,vec2(12.9898,78.233))) * 43758.5453)-0.5;
			}

			vec2 randomVec2 (float inVal){
			    return normalize(vec2(randomVal(inVal), randomVal(inVal+151.523)));
			}

			float makeWaves(vec2 uv, float theTime, float offset){
			    float result = 0.0;
			    float direction = 0.0;
			    float sineWave = 0.0;
			    vec2 randVec = vec2(1.0,0.0);
			    float i;

			    for(int n = 0; n < 16; n++){
			        i = float(n)+offset;
			        randVec = randomVec2(float(i));
			  		direction = (uv.x*randVec.x+uv.y*randVec.y);
			        sineWave = sin(direction*randomVal(i+1.6516)+theTime*timeSpeed);
			        sineWave = smoothstep(0.0,1.0,sineWave);
			    	result += randomVal(i+123.0)*sineWave;
			    }

			    return result;
			}

			float lightShafts(vec2 st) {
			    float angle = -0.2;
			    vec2 _st = st;
			    float t = iTime / 16.;
			    st = vec2(st.x * cos(angle) - st.y * sin(angle), 
			              st.x * sin(angle) + st.y * cos(angle));
			    float val = fbm(vec2(st.x*2. + 200. + t, st.y/4.));
			    val += fbm(vec2(st.x*2. + 200. - t, st.y/4.));
			    val = val / 3.;
			    float mask = pow(clamp(1.0 - abs(_st.y-0.15), 0., 1.)*0.49 + 0.5, 2.0);
			    mask *= clamp(1.0 - abs(_st.x+0.2), 0., 1.) * 0.49 + 0.5;
				return pow(val*mask, 2.0);
			}

			void main(){
				vec2 uv = vUv;
			    vec2 uv2 = vec2(uv.x * 100.0, uv.y * 150.0); // scale

			    
			    float result = 0.0;
			    float result2 = 0.0;
			    
			    result = makeWaves( uv2+vec2(iTime*timeSpeed,0.0), iTime, 0.1);
			    result2 = makeWaves( uv2-vec2(iTime*0.8*timeSpeed,0.0), iTime*0.8+0.06, 0.26);
			    
			    result *= 2.6;
			    
			    result = smoothstep(0.4,1.1,1.0-abs(result));
			    result2 = smoothstep(0.4,1.1,1.0-abs(result2));
			    
			    result = 2.0*smoothstep(0.35,1.8,(result+result2)*0.5);
			    
				float distortion = mix(.025, 0.005, iDarkFactor);
			    vec2 p = vec2(result, result2)*distortion + sin(uv*16. - cos(uv.yx*16. + iTime*timeSpeed))* distortion; // Etc.
				vec4 c = vec4(result)*0.7+texture2D(iChannel0 , uv + p )*(vec4(82,181,235,255)/255.)*clamp(iDarkFactor, .7, 1.);
			   
			    
			    vec3 cc = texture2D( iChannel1, uv).rgb ;
			    
			    float waterLevel = abs(sin(iTime * .4));
			    vec3 ccm = mix(cc.rgb, c.rgb, smoothstep(waterLevel, .2, .5));

			    // wave 1 ------------------------------------------------

			    float smoothness = 0.2;
			    vec2 pp = vec2(0.0, 0.5*iResolution.y/iResolution.x);
			    vec2 q = uv * .05;

			    float qLen = length(0.0);
				float sfunc = 0.6 + 0.01*exp(sin(atan(q.y, q.x)*4.)*0.9);
				float waveShape1 = 1. - smoothstep(sfunc, sfunc + smoothness, qLen);

				float waveFunc = waterLevel + (0.005*sin(uv.x * 35. + iTime*2.)) 
				+ (0.0025*sin(uv.x * 10. + iTime*.005));
				
				waveShape1 *= 1. - smoothstep(waveFunc, waveFunc + smoothness, uv.y);
				
				vec3 col = mix(cc.rgb, c.rgb, waveShape1);
				gl_FragColor = vec4(col, 1.);

			    //if(uv.y > waterLevel )
			    //	gl_FragColor = vec4(cc.rgb, 1.);
				
			}
		`
	}
}

export { WaterShader }