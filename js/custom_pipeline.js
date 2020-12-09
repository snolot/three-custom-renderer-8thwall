import * as THREE from '../../three.js-123/build/three.module.js'

import { EffectComposer } from '../../three.js-123/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../../three.js-123/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from '../../three.js-123/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from '../../three.js-123/examples/jsm/shaders/RGBShiftShader.js';
import { DotScreenShader } from '../../three.js-123/examples/jsm/shaders/DotScreenShader.js';
import { TexturePass } from '../../three.js-123/examples/jsm/postprocessing/TexturePass.js';
import { ClearPass } from '../../three.js-123/examples/jsm/postprocessing/ClearPass.js';
import { CopyShader } from '../../three.js-123/examples/jsm/shaders/CopyShader.js';

import { WaterPass } from '../shaders/WaterPass.js'
//import { WaterRefractionPass } from '../shaders/WaterRefractionPass.js'

export const CustomPipeline = (_config = {}) => {
	const config = {
		canvas:null,
		useAlternative:false
	}

	Object.assign(config, _config)

	if(config.canvas){
		config.useAlternative = true
	}

	const raycaster = new THREE.Raycaster()
	const rayOrigin = new THREE.Vector2(0,0)
	const tapPosition = new THREE.Vector2()


	let alternativeCanvas = config.canvas

	let camera, scene, renderer
	let cameraOrtho, sceneOrtho
	let surface, modelAdded = false
	let started = false
	let rtt, quad, torus, cube, halfWidth, halfHeight 
	let composer, composer2, texturePass, clearPass, renderPass
	let texture, waterPass

	const handleTouchHandler = (e) => {
		console.log(e)

		if (e.touches.length == 2) {
			XR8.XrController.recenter()
		}

		if (e.touches.length > 2) {
			return
		}

		if(!modelAdded){
			console.log('ADD OBJECT')

	        tapPosition.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1
	        tapPosition.y = - (e.touches[0].clientY / window.innerHeight) * 2 + 1
	    
	        raycaster.setFromCamera(tapPosition, camera)	   
	    
	        const intersects = raycaster.intersectObject(surface)

	        if (intersects.length == 1 && intersects[0].object == surface) {
	          	modelAdded = true; 
	          	initBoxes(intersects[0].point)
	        }
	    }
	}

	const initOrtho = () => {

		sceneOrtho = new THREE.Scene()
		

		halfWidth = innerWidth / 2
		halfHeight = innerHeight / 2

		cameraOrtho = new THREE.OrthographicCamera( - halfWidth, halfWidth, halfHeight, - halfHeight, - 10000, 10000 );
		cameraOrtho.position.z = 20

		var diffuseMap = new THREE.TextureLoader().load( "../../three.js-dev/examples/textures/cube/SwedishRoyalCastle/pz.jpg" );
		//diffuseMap.encoding = THREE.sRGBEncoding;
		sceneOrtho.background = diffuseMap

		var materialColor = new THREE.MeshPhongMaterial( {
			map: diffuseMap
		} )

		const geometry = new THREE.TorusKnotBufferGeometry( 10, 3, 100, 16 );
		const material = new THREE.MeshPhongMaterial( { color: 0xffff00 } );
	 	torus = new THREE.Mesh( geometry, material );
	 	torus.scale.set(20, 20, 20)
	 	sceneOrtho.add(torus)
	}

	const initRTT = () => {
		const rtParameters = {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat,
			stencilBuffer: false
		};

		rtt = new THREE.WebGLRenderTarget( innerWidth, innerHeight, rtParameters ) 
	}

	const initBoxes = (point) => {
		console.log('initBoxes')
		cube = new THREE.Mesh(new THREE.BoxBufferGeometry(1,1,1), new THREE.MeshPhongMaterial({color:0xFFCC00, map:new THREE.TextureLoader().load( "../../three.js-dev/examples/textures/cube/SwedishRoyalCastle/pz.jpg" )}))
	    scene.add(cube)
	    cube.receiveShadow = true
	    cube.castShadow = true
	    cube.position.set(point.x, 0.5, point.z)
	}

	const initLights = (_scene) => {
		console.log('initLights')
		const ambient = new THREE.AmbientLight(  0x333333  );
  		_scene.add( ambient );
  
  		const dirLight = new THREE.DirectionalLight( 0xffffff, .75 );
  		dirLight.name = 'Dir. Light';
  		dirLight.position.set( 3, 12, 7);
  		dirLight.castShadow = true;
  		dirLight.shadow.camera.near = 0.1;
  		dirLight.shadow.camera.far = 100;
  		dirLight.shadow.camera.right = 17;
  		dirLight.shadow.camera.left = - 17;
  		dirLight.shadow.camera.top	= 17;
  		dirLight.shadow.camera.bottom = - 17;
  		dirLight.shadow.mapSize.width = 512;
  		dirLight.shadow.mapSize.height = 512;
  		dirLight.shadow.radius = 4;
  		dirLight.shadow.bias = -0.0005;
  		
  		const dirGroup = new THREE.Group();
  		dirGroup.add( dirLight );
  		_scene.add( dirGroup );
	}

	const initScene = () => {


		console.log('initScene')
		const planeGeometry = new THREE.PlaneBufferGeometry( 100, 100 )
		const planeMaterial = new THREE.ShadowMaterial({opacity:.3})
	    
	    surface = new THREE.Mesh( planeGeometry, planeMaterial )
	    surface.rotateX( - Math.PI / 2 )
	    surface.receiveShadow = true

	    scene.add(surface)
	}

	const initEvents = () => {
		console.log('initEvents')
		renderer.domElement.addEventListener('touchstart', handleTouchHandler, false)
		renderer.domElement.addEventListener('touchmove',  (event) => { event.preventDefault() }) 
	}

	const initComposer = () => {

		const rtParameters = {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat,
			stencilBuffer: true
		}

		composer = new EffectComposer( renderer )
		
		clearPass = new ClearPass( 0xFFFFFF, 0.0 )
		composer.addPass( clearPass )

		if(!config.useAlternative){
			texturePass = new TexturePass()
			composer.addPass( texturePass )

			const video = document.querySelector('video')
			
			texture = new THREE.VideoTexture(video)
			texturePass.map = texture
		}

		renderPass = new RenderPass( scene, camera )
		renderPass.clear = false
		composer.addPass( renderPass )

		const effect1 = new WaterPass()
		composer.addPass(effect1)

		/*const effect2 = new ShaderPass( DotScreenShader )
		effect2.uniforms[ 'scale' ].value = 2
		composer.addPass( effect2 )

		const effect3 = new ShaderPass( RGBShiftShader )
		effect3.uniforms[ 'amount' ].value = 0.0015
		composer.addPass( effect3 )*/


	}

	const base = {
		name:'custom-pipeline',
		onStart:({ canvas, GLctx }) => {
			camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.01, 1000)
			
			scene = new THREE.Scene()
			scene.add(camera)

			const nCanvas = (config.useAlternative) ? alternativeCanvas : canvas
			const nContext = (config.useAlternative) ?  (alternativeCanvas.getContext('webgl', {alpha: true})) : GLctx
	
			renderer = new THREE.WebGLRenderer({
				alpha:true,
				antialias:false,
				canvas:nCanvas,
				context:nContext
			})

			renderer.autoClear = false
			renderer.setSize(innerWidth, innerHeight)
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;
			renderer.setClearColor(0xFFFFFF, 0)
			
			camera.position.set(0,2,0)

			XR8.XrController.updateCameraProjectionMatrix({
		      	origin: camera.position,
		      	facing: camera.quaternion,
		    })

		    initScene()
		    initEvents()
		    initRTT()
		    initOrtho()
		    initLights(scene)
		    initLights(sceneOrtho)
		    initComposer()

		    started = true
		},
		onUpdate:({ processCpuResult }) => {

			if(texture){
				texture.update()
			}

			camera.updateProjectionMatrix()

			let data = processCpuResult.reality
			if (!(data && data.intrinsics)) return

			let { intrinsics, position, rotation } = data
			let { elements } = camera.projectionMatrix

			for (let i = 0; i < 16; i++) {
				elements[i] = intrinsics[i]
			}

			camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
			camera.setRotationFromQuaternion(rotation)
			camera.position.copy(position)

			torus.rotateX(.02)
			torus.rotateZ(.01)
		},
		onRender:() => {
			// Just to draw torus on WebGLRenderTarget
			renderer.setRenderTarget(rtt)
			renderer.clear()
			renderer.render(sceneOrtho, cameraOrtho)
			renderer.setRenderTarget(null)
			
			if(cube){
				cube.material.map = rtt.texture
			}
			// uncomment next 2 lines when render with no composer
			/*renderer.clearDepth()
			renderer.render(scene, camera)*/
			

			composer.render()
			//composer2.render()
		},
		onCanvasSizeChange ({ GLctx, videoWidth, videoHeight, canvasWidth, canvasHeight }) {
			if(started){
				renderer.setSize(canvasWidth, canvasHeight)
				composer.setSize(canvasWidth, canvasHeight)
				camera.aspect = canvasWidth/canvasHeight
				camera.updateProjectionMatrix()
			}			
		}
	}

	return base
}
