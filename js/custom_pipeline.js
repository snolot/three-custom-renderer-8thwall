const CustomPipeline = (_config) => {
	const config = {

	}

	Object.assign(config, _config)

	const raycaster = new THREE.Raycaster()
	const rayOrigin = new THREE.Vector2(0,0)
	const tapPosition = new THREE.Vector2()

	let camera, scene, renderer
	let cameraOrtho, sceneOrtho
	let surface, modelAdded = false
	let started = false
	let rtt, quad, torus, cube, halfWidth, halfHeight 

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
		sceneOrtho.background = new THREE.Color(0xFF3300)

		halfWidth = innerWidth / 2
		halfHeight = innerHeight / 2

		cameraOrtho = new THREE.OrthographicCamera( - halfWidth, halfWidth, halfHeight, - halfHeight, - 10000, 10000 );
		cameraOrtho.position.z = 20

		var diffuseMap = new THREE.TextureLoader().load( "../three.js-dev/examples/textures/cube/SwedishRoyalCastle/pz.jpg" );
		//diffuseMap.encoding = THREE.sRGBEncoding;

		var materialColor = new THREE.MeshPhongMaterial( {
			map: diffuseMap
		} )

		const geometry = new THREE.TorusKnotBufferGeometry( 10, 3, 100, 16 );
		const material = new THREE.MeshPhongMaterial( { color: 0xffff00 } );
	 	torus = new THREE.Mesh( geometry, material );
	 	torus.scale.set(20, 20, 20)
	 	sceneOrtho.add(torus)

		/*quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1, 1 ), materialColor );
		quad.position.z = - 500;
		quad.scale.set( innerWidth, innerHeight, 1 );
		sceneOrtho.add( quad );*/
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
		cube = new THREE.Mesh(new THREE.BoxBufferGeometry(1,1,1), new THREE.MeshPhongMaterial({color:0xFFCC00, map:new THREE.TextureLoader().load( "../three.js-dev/examples/textures/cube/SwedishRoyalCastle/pz.jpg" )}))
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

	const base = {
		name:'custom-pipeline',
		onStart:({ canvas, GLctx }) => {
			camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.01, 1000)
			
			scene = new THREE.Scene()
			scene.add(camera)

			renderer = new THREE.WebGLRenderer({
				alpha:false,
				antialias:false,
				canvas,
				GLctx
			})

			renderer.autoClear = false
			renderer.setSize(innerWidth, innerHeight)
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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

		    started = true
		},
		onUpdate:({ processCpuResult }) => {

			camera.updateProjectionMatrix()

			let data = processCpuResult.reality
			if (!(data && data.intrinsics)) return

			let { intrinsics, position, rotation } = data
			let { elements } = camera.projectionMatrix

			for (let i = 0; i < 16; i++) {
				elements[i] = intrinsics[i]
			}

			camera.projectionMatrixInverse.getInverse(camera.projectionMatrix)
			camera.setRotationFromQuaternion(rotation)
			camera.position.copy(position)

			torus.rotateX(.02)
			torus.rotateZ(.01)
		},
		onRender:() => {
			renderer.setRenderTarget(rtt)
			renderer.clear()
			renderer.render(sceneOrtho, cameraOrtho)
			renderer.setRenderTarget(null)
			

			if(cube){
				cube.material.map = rtt.texture
				console.log('cube')
			}

			
			renderer.clearDepth()
			renderer.render(scene, camera)
			//renderer.setRenderTarget(null)

		},
		onCanvasSizeChange ({ GLctx, videoWidth, videoHeight, canvasWidth, canvasHeight }) {
			if(started){
				renderer.setSize(canvasWidth, canvasHeight)
				camera.aspect = canvasWidth/canvasHeight
				camera.updateProjectionMatrix()
			}			
		}
	}

	return base
}