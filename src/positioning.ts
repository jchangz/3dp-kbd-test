import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js"
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"

let canvas: HTMLElement | null,
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  controls: OrbitControls

const keysGroup = new THREE.Group()
let switchMesh: THREE.InstancedMesh
const switch3DMap = new THREE.Object3D()

init()
animate()

function init() {
  canvas = document.querySelector(".canvas")
  scene = new THREE.Scene()

  if (canvas) {
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x1f1f1f)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight)
    canvas.appendChild(renderer.domElement)

    camera = new THREE.PerspectiveCamera(1, canvas.offsetWidth / canvas.offsetHeight, 1, 1000)
    camera.position.set(110, 90, -70)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    // controls.autoRotate = true;
    controls.minDistance = 100
    controls.maxDistance = 200

    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()

    // Loaders

    const manager = new THREE.LoadingManager(() => {
      pmremGenerator.dispose()
    })
    const dracoLoader = new DRACOLoader(manager)
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/")
    const loader = new GLTFLoader(manager).setDRACOLoader(dracoLoader).setMeshoptDecoder(MeshoptDecoder)
    const thing = []
    loader.load("models/type2mounting.glb", function (gltf) {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.isMesh) {
          thing.push({
            x: Math.round(child.position.x * 1e4) / 1e4,
            y: Math.round(child.position.y * 1e4) / 1e4,
            z: Math.round(child.position.z * 1e4) / 1e4,
          })
          console.log(child.position, child.name)
        }
      })
      console.log(thing)
      scene.add(gltf.scene)
    })
  }
}

function animate() {
  requestAnimationFrame(animate)
  render()
}

function render() {
  if (switchMesh) {
    let i = 0
    for (let x = 0; x < mx.x.length; x++) {
      switch3DMap.position.set(mx.x[i], mx.y[i], mx.z[i])
      switch3DMap.updateMatrix()

      keysGroup.children.forEach((mesh) => {
        if (mesh instanceof THREE.InstancedMesh && rows[mesh.name].matrix[i]) {
          mesh.setMatrixAt(rows[mesh.name].matrix[i], switch3DMap.matrix)
        }
      })
      switchMesh.setMatrixAt(i++, switch3DMap.matrix)
    }
    switchMesh.instanceMatrix.needsUpdate = true
  }
  controls.update()
  renderer.render(scene, camera)
}

const test = [
  { x: -1.6669, y: -0.0236, z: -0.4951 },
  { x: -1.2859, y: -0.0236, z: -0.4951 },
  { x: -1.0954, y: -0.0236, z: -0.4951 },
  { x: -0.9049, y: -0.0236, z: -0.4951 },
  { x: -0.7144, y: -0.0236, z: -0.4951 },
  { x: -0.4286, y: -0.0236, z: -0.4951 },
  { x: -0.2381, y: -0.0236, z: -0.4951 },
  { x: 0.4483, y: -0.0236, z: -0.4951 },
  { x: 0.6388, y: -0.0236, z: -0.4951 },
  { x: 0.9245, y: -0.0236, z: -0.4951 },
  { x: 1.115, y: -0.0236, z: -0.4951 },
  { x: 1.3055, y: -0.0236, z: -0.4951 },
  { x: 1.496, y: -0.0236, z: -0.4951 },
  { x: 1.877, y: -0.0236, z: -0.4951 },
  { x: 2.0675, y: -0.0236, z: -0.4951 },
  { x: 2.258, y: -0.0236, z: -0.4951 },
  { x: -1.6669, y: -0.0485, z: -0.2583 },
  { x: -1.3811, y: -0.0485, z: -0.2583 },
  { x: -1.1906, y: -0.0485, z: -0.2583 },
  { x: -1.0001, y: -0.0485, z: -0.2583 },
  { x: -0.8096, y: -0.0485, z: -0.2583 },
  { x: -0.6191, y: -0.0485, z: -0.2583 },
  { x: -0.4286, y: -0.0485, z: -0.2583 },
  { x: -0.2381, y: -0.0485, z: -0.2583 },
  { x: 0.4483, y: -0.0485, z: -0.2583 },
  { x: 0.6388, y: -0.0485, z: -0.2583 },
  { x: 0.8293, y: -0.0485, z: -0.2583 },
  { x: 1.0198, y: -0.0485, z: -0.2583 },
  { x: 1.2103, y: -0.0485, z: -0.2583 },
  { x: 1.4008, y: -0.0485, z: -0.2583 },
  { x: 1.6865, y: -0.0485, z: -0.2583 },
  { x: 2.0675, y: -0.0485, z: -0.2583 },
  { x: 2.258, y: -0.0485, z: -0.2583 },
  { x: -1.6669, y: -0.0684, z: -0.0689 },
  { x: -1.3335, y: -0.0684, z: -0.0689 },
  { x: -1.0954, y: -0.0684, z: -0.0689 },
  { x: -0.9049, y: -0.0684, z: -0.0689 },
  { x: -0.7144, y: -0.0684, z: -0.0689 },
  { x: -0.5239, y: -0.0684, z: -0.0689 },
  { x: -0.3334, y: -0.0684, z: -0.0689 },
  { x: 0.353, y: -0.0684, z: -0.0689 },
  { x: 0.5435, y: -0.0684, z: -0.0689 },
  { x: 0.734, y: -0.0684, z: -0.0689 },
  { x: 0.9245, y: -0.0684, z: -0.0689 },
  { x: 1.115, y: -0.0684, z: -0.0689 },
  { x: 1.3055, y: -0.0684, z: -0.0689 },
  { x: 1.496, y: -0.0684, z: -0.0689 },
  { x: 1.7341, y: -0.0684, z: -0.0689 },
  { x: 2.0675, y: -0.0684, z: -0.0689 },
  { x: 2.258, y: -0.0684, z: -0.0689 },
  { x: -1.6669, y: -0.0883, z: 0.1206 },
  { x: -1.3573, y: -0.0883, z: 0.1206 },
  { x: -1.0478, y: -0.0883, z: 0.1206 },
  { x: -0.8573, y: -0.0883, z: 0.1206 },
  { x: -0.6668, y: -0.0883, z: 0.1206 },
  { x: -0.4763, y: -0.0883, z: 0.1206 },
  { x: -0.2858, y: -0.0883, z: 0.1206 },
  { x: 0.4006, y: -0.0883, z: 0.1206 },
  { x: 0.5911, y: -0.0883, z: 0.1206 },
  { x: 0.7816, y: -0.0883, z: 0.1206 },
  { x: 0.9721, y: -0.0883, z: 0.1206 },
  { x: 1.1626, y: -0.0883, z: 0.1206 },
  { x: 1.3531, y: -0.0883, z: 0.1206 },
  { x: 1.6627, y: -0.0883, z: 0.1206 },
  { x: 2.0675, y: -0.0883, z: 0.1206 },
  { x: 2.258, y: -0.0883, z: 0.1206 },
  { x: -1.6669, y: -0.1082, z: 0.3101 },
  { x: -1.2621, y: -0.1082, z: 0.3101 },
  { x: -0.9525, y: -0.1082, z: 0.3101 },
  { x: -0.762, y: -0.1082, z: 0.3101 },
  { x: -0.5715, y: -0.1082, z: 0.3101 },
  { x: -0.381, y: -0.1082, z: 0.3101 },
  { x: -0.1905, y: -0.1082, z: 0.3101 },
  { x: 0.4959, y: -0.1082, z: 0.3101 },
  { x: 0.6864, y: -0.1082, z: 0.3101 },
  { x: 0.8769, y: -0.1082, z: 0.3101 },
  { x: 1.0674, y: -0.1082, z: 0.3101 },
  { x: 1.2579, y: -0.1082, z: 0.3101 },
  { x: 1.5198, y: -0.1082, z: 0.3101 },
  { x: 2.0675, y: -0.1082, z: 0.3101 },
  { x: -1.6669, y: -0.1281, z: 0.4995 },
  { x: -1.3335, y: -0.1281, z: 0.4995 },
  { x: -0.9525, y: -0.1281, z: 0.4995 },
  { x: -0.6906, y: -0.1281, z: 0.4995 },
  { x: -0.3572, y: -0.1281, z: 0.4995 },
  { x: 0.5673, y: -0.1281, z: 0.4995 },
  { x: 0.9007, y: -0.1281, z: 0.4995 },
  { x: 1.1626, y: -0.1281, z: 0.4995 },
  { x: 1.5436, y: -0.1281, z: 0.4995 },
  { x: 1.8771, y: -0.1281, z: 0.4995 },
  { x: 2.0676, y: -0.1281, z: 0.4995 },
  { x: 2.2581, y: -0.1281, z: 0.4995 },
]
