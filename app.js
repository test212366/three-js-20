import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'
 
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'


import img1 from './1.jpg'
import img2 from './2.jpg'
import img3 from './3.jpg'
import dips from './dips.png'


const images = [img1, img2, img3]


const textures = images.map(img => new THREE.TextureLoader().load(img))

export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		
		this.container = options.dom
		
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// // for renderer { antialias: true }
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		this.renderer.setClearColor(0x000000, 1)
		this.renderer.useLegacyLights = true
		this.renderer.outputEncoding = THREE.sRGBEncoding
 

		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.container.appendChild(this.renderer.domElement)
 


		// this.camera = new THREE.PerspectiveCamera( 70,
		// 	 this.width / this.height,
		// 	 0.001,
		// 	 1000
		// )
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
			format: THREE.RGBAFormat,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter
		
		})
		this.renderTarget1 = new THREE.WebGLRenderTarget(this.width, this.height, {
			format: THREE.RGBAFormat,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter
		})

		const frushtumSize = 4 // IF i set here like 3 that will be absolutly another effect 
		this.aspect = this.width / this.height
		this.camera = new THREE.OrthographicCamera(frushtumSize * this.aspect / - 2, frushtumSize * this.aspect / 2, frushtumSize / 2, frushtumSize / -2, -1000, 1000)
		this.camera.position.set(0, 0, 2)



		this.scroll = 0
		this.scrollTarget = 0
		this.currentScroll = 0
		// this.camera.position.set(0, 0, 2) 
		//this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0

 
		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
		this.gltf = new GLTFLoader()
		this.gltf.setDRACOLoader(this.dracoLoader)
		
		
		this.backgroundQuad = new THREE.Mesh(
			new THREE.PlaneGeometry(4 * this.aspect, 4),
			new THREE.MeshBasicMaterial({
			 
			})
		)
		// this.backgroundQuad.position.y = 0.5
		this.backgroundQuad.position.z = -0.5

		this.scene.add(this.backgroundQuad)


		this.isPlaying = true
		this.initQuad()
		this.addObjects()		 
		//this.resize()
		this.render()
		this.setupResize()
		this.scrollEvent()
 

		 
	}

	initQuad() {

		this.materialQuad = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide  ,
			uniforms: {
				time: {value: 0},
				uTexture: {value: null},
				dir: {value: 0},
				speed: {value: 0},
				uDisp: {value: new THREE.TextureLoader().load(dips)},


				resolution: {value: new THREE.Vector4()}
			},
			transparent: true,
			vertexShader,
			fragmentShader
		})




		this.sceneQuad = new THREE.Scene()
		// this.materialQuad = new THREE.MeshBasicMaterial({
		// 	transparent: true
		// } )
		this.quad = new THREE.Mesh(
			new THREE.PlaneGeometry(4 * this.aspect, 4),
			this.materialQuad
		)
		this.sceneQuad.add(this.quad)
	
	}


	scrollEvent() {
		document.addEventListener('mousewheel', e => {


			this.scrollTarget = e.wheelDelta * .3

		})
	}

	settings() {
		let that = this
		this.settings = {
			progress: 0
		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.camera.aspect = this.width / this.height


		this.imageAspect = 853/1280
		let a1, a2
		if(this.height / this.width > this.imageAspect) {
			a1 = (this.width / this.height) * this.imageAspect
			a2 = 1
		} else {
			a1 = 1
			a2 = (this.height / this.width) * this.imageAspect
		} 


		this.material.uniforms.resolution.value.x = this.width
		this.material.uniforms.resolution.value.y = this.height
		this.material.uniforms.resolution.value.z = a1
		this.material.uniforms.resolution.value.w = a2

		this.camera.updateProjectionMatrix()



	}


	addObjects() {
		let that = this
		 
		
		this.meshes = []
		this.n = 10
		this.geometry = new THREE.PlaneGeometry(1,1,1,1)

		for (let i = 0; i < this.n; i++) {
			const mesh = new THREE.Mesh(this.geometry, new THREE.MeshBasicMaterial({
				map: textures[i % textures.length]
			}))

			this.meshes.push({
				mesh,
				index: i
			})


			this.scene.add(mesh)
		}
 
 
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0xeeeeee, 0.5)
		this.scene.add(light1)
	
	
		const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5)
		light2.position.set(0.5,0,0.866)
		this.scene.add(light2)
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	updateMeshes() {

		this.margin = 1.1

		this.wholeWidth = this.n * this.margin


		this.meshes.forEach(o => {
			o.mesh.position.x = (this.margin * o.index + this.currentScroll + 42069 * this.wholeWidth) % this.wholeWidth - 2 * this.margin
		})
	}

	render() {
		if(!this.isPlaying) return
		this.time += 0.05
		this.scroll += (this.scrollTarget-this.scroll) * 0.1
		this.scroll *= 0.9
		this.scrollTarget *= 0.9

		console.log(this.currentScroll);

		this.currentScroll += this.scroll * 0.01


		this.materialQuad.uniforms.time.value = this.time
		 this.updateMeshes()
		//this.renderer.setRenderTarget(this.renderTarget)
		//this.renderer.render(this.scene, this.camera)
		//this.renderer.setRenderTarget(null)
 
		this.renderer.setRenderTarget(this.renderTarget)
		this.renderer.render(this.scene, this.camera)


		// this.renderer.setRenderTarget(this.renderTarget1)
		this.renderer.setRenderTarget(this.renderTarget1)
		this.materialQuad.uniforms.uTexture.value = this.renderTarget.texture
 
		this.materialQuad.uniforms.speed.value = Math.min(0.3, Math.abs(this.scroll))

		this.materialQuad.uniforms.dir.value = Math.sin(this.scroll)


		this.renderer.render(this.sceneQuad, this.camera)




	 
		this.renderer.setRenderTarget(null)
		this.backgroundQuad.material.map = this.renderTarget1.texture
		this.renderer.render(this.scene, this.camera)

		// this.scene.scale.setScalar(this.time)

		requestAnimationFrame(this.render.bind(this))
	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 