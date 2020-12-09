import {
	ShaderMaterial,
	UniformsUtils,
	Color,
	TextureLoader,
	Matrix4
} from '../../three.js-123/build/three.module.js'

import { Pass } from '../../three.js-123/examples/jsm/postprocessing/Pass.js'
import { WaterRefractionShader } from '../../three.js-123/examples/jsm/shaders/WaterRefractionShader.js';

const WaterRefractionPass = (camera) => {
	Pass.call( this )
	this.camera = camera
	const shader = WaterRefractionShader()
	
	this.uniforms = UniformsUtils.clone( shader.uniforms )
	
	this.material = new ShaderMaterial({
		uniforms: this.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader
	})
	
	this.fsQuad = new Pass.FullScreenQuad( this.material )
	this.textureMatrix = new Matrix4();
	const dudvMap = new TextureLoader().load('../../three.js-123/examples/textures/waterdudv.jpg')
	dudvMap.wrapS = dudvMap.wrapT = THREE.RepeatWrapping;
	
	this.uniforms['color'].value = new Color(0x4375BC)
	this.uniforms['tDudv'].value = dudvMap
	this.uniforms['textureMatrix'].value = this.textureMatrix

}

WaterRefractionPass.prototype = Object.assign( Object.create( Pass.prototype ), {
	constructor: WaterRefractionPass,
	render: function ( renderer, writeBuffer, readBuffer , deltaTime /*, maskActive */ ) {
		
		// this matrix does range mapping to [ 0, 1 ]

		this.textureMatrix.set(
			0.5, 0.0, 0.0, 0.5,
			0.0, 0.5, 0.0, 0.5,
			0.0, 0.0, 0.5, 0.5,
			0.0, 0.0, 0.0, 1.0
		);

		// we use "Object Linear Texgen", so we need to multiply the texture matrix T
		// (matrix above) with the projection and view matrix of the virtual camera
		// and the model matrix of the refractor

		this.textureMatrix.multiply( this.camera.projectionMatrix );
		this.textureMatrix.multiply( this.camera.matrixWorldInverse );
		//this.textureMatrix.multiply( scope.matrixWorld );

		this.uniforms[ "tDiffuse" ].value = readBuffer.texture;
		this.uniforms[ "time" ].value += deltaTime 

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

export { WaterRefractionPass }