import {
	ShaderMaterial,
	UniformsUtils,
	TextureLoader
} from '../../three.js-123/build/three.module.js'

import { Pass } from '../../three.js-123/examples/jsm/postprocessing/Pass.js'
//import { WaterShader } from './WaterShader.js'
import { TestShader } from './TestShader.js'

const WaterPass = function(){
	Pass.call( this )
	const shader = TestShader()//WaterShader()
	
	this.uniforms = UniformsUtils.clone( shader.uniforms )
	
	this.material = new ShaderMaterial({
		uniforms: this.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader
	})
	
	this.fsQuad = new Pass.FullScreenQuad( this.material )
	//this.uniforms['iChannel1'].value = new TextureLoader().load('./textures/tex13.png')
	/*this.darkFactor = this.uniforms['darkFactor'].value
	this.iChannel1 = this.uniforms['iChannel1'].value*/
}

WaterPass.prototype = Object.assign( Object.create( Pass.prototype ), {
	constructor: WaterPass,
	render: function ( renderer, writeBuffer, readBuffer , deltaTime /*, maskActive */ ) {
		
		
		this.uniforms[ "iChannel0" ].value = readBuffer.texture;
		this.uniforms[ "iTime" ].value += deltaTime 
		

		if ( this.renderToScreen ) {
			renderer.setRenderTarget( null );
			this.fsQuad.render( renderer );
		} else {
			renderer.setRenderTarget( writeBuffer );
			if ( this.clear ) renderer.clear();
			this.fsQuad.render( renderer );
		}
	}
})

export { WaterPass }