
const TestShader = () => {
	
	return  {
		uniforms:{
			iChannel0:{type:'t', value:null },
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
			uniform float iTime;

			void main(){
				vec2 uv = vUv;
				uv.x += cos(uv.y * 25.0 + iTime * 1.0) * 0.02;
    			uv.y += sin(uv.y * 25.0 + iTime * 1.0 + 0.5) * 0.02;
    

			    vec4 c = texture2D(iChannel0, uv);

			    gl_FragColor = vec4(c.rgb + vec3(0., 0., .55), c.a);
				
			}
		`
	}
}

export { TestShader }