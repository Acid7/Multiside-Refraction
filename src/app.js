import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Pane } from 'tweakpane'

import './app.styl'

import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'
import backfaceVertexShader from './shaders/backfaceVertex.glsl'
import backfaceFragmentShader from './shaders/backfaceFragment.glsl'

import cubemapPX from 'url:./cubemap/px.jpg'
import cubemapNX from 'url:./cubemap/nx.jpg'
import cubemapPY from 'url:./cubemap/py.jpg'
import cubemapNY from 'url:./cubemap/ny.jpg'
import cubemapPZ from 'url:./cubemap/pz.jpg'
import cubemapNZ from 'url:./cubemap/nz.jpg'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import model from 'url:./models/diamond.glb'



// Settings

const settings = {
	geometry: 'icosahedron',
	uColor: '#ffffff',
	uRefractionRatio: 0.88,
	uFresnelBias: 0.1,
	uFresnelPower: 2.0,
	uFresnelScale: 1.0,
	uBackfaceVisibility: 0.33,
}

// Tweaks

const pane = new Pane()
pane.addInput(settings, 'geometry', { label: 'Geometry', options: {
	Icosahedron: 'icosahedron',
	Box: 'box',
	Diamond: 'diamond',
}})
pane.addInput(settings, 'uColor', { picker: 'inline' })
pane.addInput(settings, 'uRefractionRatio', { min: 0, max: 1, step: 0.01 })
pane.addInput(settings, 'uFresnelBias', { min: 0, max: 1, step: 0.01 })
pane.addInput(settings, 'uFresnelPower', { min: 0, max: 5, step: 0.01 })
pane.addInput(settings, 'uFresnelScale', { min: 0, max: 2, step: 0.01 })
pane.addInput(settings, 'uBackfaceVisibility', { min: 0, max: 0.33, step: 0.01 })

pane.on('change', (event) => {
	if (event.presetKey === 'geometry') {
		if (event.value === 'icosahedron') {
			scene.mesh.geometry = scene.icosahedronGeometry
			scene.backfaceMesh.geometry = scene.icosahedronGeometry
		} else if (event.value === 'box') {
			scene.mesh.geometry = scene.boxGeometry
			scene.backfaceMesh.geometry = scene.boxGeometry
		} else if (event.value === 'diamond') {
			scene.mesh.geometry = scene.diamondGeometry
			scene.backfaceMesh.geometry = scene.diamondGeometry
		}
	}
})



// Scene

class Scene {
	constructor() {

		// Dimensions
		this.width = window.innerWidth
		this.height = window.innerHeight
		this.clock = new THREE.Clock()

		// Init
		this.setRenderer()
		this.setBackground()
		this.setCamera()
		this.addGeometry()
		this.render()
	}



	// Renderer

	setRenderer() {
		this.scene = new THREE.Scene()
		this.backfaceScene = new THREE.Scene()

		this.renderer = new THREE.WebGLRenderer({
			canvas: document.getElementById('canvas'),
			antialias: true,
			alpha: true,
		})

		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderer.setSize(this.width, this.height)
		this.renderer.autoClear = false

		// Backface Render Target
		if (this.renderer.capabilities.isWebGL2) {
			this.backfaceRenderTarget = new THREE.WebGLMultisampleRenderTarget(this.width, this.height, {
				type: THREE.HalfFloatType
			})
		} else {
			this.backfaceRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
				type: THREE.HalfFloatType,
			})
		}

		// Resize
		window.addEventListener('resize', () => {
			this.width = window.innerWidth
			this.height = window.innerHeight
			this.renderer.setSize(this.width, this.height)
			this.backfaceRenderTarget.setSize(this.width, this.height)
			this.camera.aspect = this.width / this.height
			this.camera.updateProjectionMatrix()
			this.mesh.material.uniforms.uResolution.value = [
				this.width * this.renderer.getPixelRatio(),
				this.height * this.renderer.getPixelRatio(),
			]
		})
	}



	// Background

	setBackground() {
		this.cubemap = new THREE.CubeTextureLoader().load([ cubemapPX, cubemapNX, cubemapPY, cubemapNY, cubemapPZ, cubemapNZ ])
		this.scene.background = this.cubemap
	}



	// Camera

	setCamera() {
		this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 100)
		this.camera.position.set(0, 0, 7)
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.controls.enableDamping = true
	}



	// Geometry

	addGeometry() {

		this.icosahedronGeometry = new THREE.IcosahedronGeometry(1.2)
		this.boxGeometry = new THREE.BoxGeometry(1.75, 1.75, 1.75)
		const gltfLoader = new GLTFLoader()
		gltfLoader.load(model, (gltf) => {
			this.diamondGeometry = gltf.scene.children[0].geometry
			this.diamondGeometry.translate(0, -4, 0)
			this.diamondGeometry.scale(0.25, 0.25, 0.25)
		})

		//  Backface Material
		const backMaterial = new THREE.ShaderMaterial({
			vertexShader: backfaceVertexShader,
			fragmentShader: backfaceFragmentShader,
			uniforms: {
				tCube: { value: this.cubemap },
			},
			side: THREE.BackSide
		})

		this.backfaceMesh = new THREE.Mesh(this.icosahedronGeometry, backMaterial)
		this.backfaceScene.add(this.backfaceMesh)

		// Material
		const material = new THREE.ShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms: {
				tCube: { value: this.cubemap },
				uBackfaceMap: { value: this.backfaceRenderTarget.texture },
				uColor: { value: new THREE.Color(settings.uColor) },
				uRefractionRatio: { value: settings.uRefractionRatio },
				uFresnelBias: { value: settings.uFresnelBias },
				uFresnelPower: { value: settings.uFresnelPower },
				uFresnelScale: { value: settings.uFresnelScale },
				uBackfaceVisibility: { value: settings.uBackfaceVisibility },
				uResolution: { value: [
					this.width * this.renderer.getPixelRatio(),
					this.height * this.renderer.getPixelRatio(),
				]},
			}
		})

		this.mesh = new THREE.Mesh(this.icosahedronGeometry, material)
		this.scene.add(this.mesh)

	}



	// Render

	render() {

		this.controls.update()

		// Update uniforms
		this.mesh.material.uniforms.uColor.value = new THREE.Color(settings.uColor)
		this.mesh.material.uniforms.uRefractionRatio.value = settings.uRefractionRatio
		this.mesh.material.uniforms.uFresnelBias.value = settings.uFresnelBias
		this.mesh.material.uniforms.uFresnelPower.value = settings.uFresnelPower
		this.mesh.material.uniforms.uFresnelScale.value = settings.uFresnelScale
		this.mesh.material.uniforms.uBackfaceVisibility.value = settings.uBackfaceVisibility

		// Render

		this.renderer.setRenderTarget(this.backfaceRenderTarget)
		this.renderer.clearDepth()
		this.renderer.render(this.backfaceScene, this.camera)

		this.renderer.setRenderTarget(null)
		this.renderer.clearDepth()
		this.renderer.render(this.scene, this.camera)

		requestAnimationFrame(() => { this.render() })
	}


}

const scene = new Scene()
