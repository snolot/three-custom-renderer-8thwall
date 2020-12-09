
const TestShader2 = () => {
	
	return  {
		uniforms:{
			iChannel0:{type:'t', value:null },
			iChannel1:{type:'t', value:null },
			iTime:{type:'f', value:0}
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
			uniform sampler2D iChannel0;
			uniform sampler2D iChannel1;
			uniform float iTime;

			void main(){
				vec2 uv = vUv;
				vec2 warpUV = 2. * uv;

				float d = length( warpUV );
				vec2 st = warpUV*0.1 + 0.2*vec2(cos(0.071*iTime*2.+d),
											sin(0.073*iTime*2.-d));

			    vec3 warpedCol = texture2D( iChannel1, st ).xyz * 2.0;
			    float w = max( warpedCol.r, 0.85);
				
			    vec2 offset = 0.01 * cos( warpedCol.rg * 3.14159 );
			    float aa = texture2D( iChannel0, uv).a;
			    vec4 cc = texture2D( iChannel0, uv + offset );
			    vec3 col = cc.rgb * vec3(0.8, 0.8, 1.5) ;
			    
				col *= w*1.2;
				
				gl_FragColor = vec4( mix(col, cc.rgb, 0.5),  aa);
				
			}
		`
	}
}

export { TestShader2 }


