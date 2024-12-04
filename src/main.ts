import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js"
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { GUI } from "three/addons/libs/lil-gui.module.min.js"
import { MathUtils } from "three"
import { geometry } from "./geometry.json"
import "./style.css"

interface SwitchData {
  mx: { x: number; y: number; z: number }[]
  rows: {
    [key: string]: { length: number; matrix: number[] }
  }
}

const params = {
  envMapRotation: 0,
  envMapIntensity: 1,
}
const envMapRotation = new THREE.Euler(0, MathUtils.degToRad(params.envMapRotation), 0)

let canvas: HTMLElement | null
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
const scene = new THREE.Scene()
const mainGroup = new THREE.Group()
const fov = 50

const centerVector = new THREE.Vector3()
const centerBox = new THREE.Box3()

const switchGLB = "switch.glb"
const keycapGLB = "keycaps.glb"

const keyMat = new THREE.MeshStandardMaterial({
  color: 0x171718,
  roughness: 0.5,
  envMapIntensity: params.envMapIntensity,
  envMapRotation: envMapRotation,
})
const baseMat = new THREE.MeshStandardMaterial({
  color: 0x171718,
  roughness: 0.3,
  envMapIntensity: params.envMapIntensity,
  envMapRotation: envMapRotation,
})

init()

function init() {
  canvas = document.querySelector<HTMLDivElement>("#app")

  const manager = new THREE.LoadingManager()
  const dracoLoader = new DRACOLoader(manager)
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/")
  const loader = new GLTFLoader(manager).setDRACOLoader(dracoLoader).setMeshoptDecoder(MeshoptDecoder)

  if (canvas) {
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.VSMShadowMap
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setAnimationLoop(animate)
    canvas.appendChild(renderer.domElement)

    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()
    const environment = new RoomEnvironment()
    const roomEnv = pmremGenerator.fromScene(environment).texture
    keyMat.envMap = roomEnv
    baseMat.envMap = roomEnv
    // scene.environment = roomEnv

    camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.set(0, 6, 12)
    setCameraFOV()

    controls = new OrbitControls(camera, renderer.domElement)

    const texloader = new THREE.TextureLoader(manager)

    const keyNormal = texloader.load("textures/key_normal.webp")
    keyNormal.repeat.set(10, 10)
    keyMat.normalMap = keyNormal

    const keyRoughness = texloader.load("textures/key_roughness.webp")
    keyRoughness.repeat.set(10, 10)
    keyMat.roughnessMap = keyRoughness

    keyNormal.wrapS = keyNormal.wrapT = keyRoughness.wrapS = keyRoughness.wrapT = THREE.RepeatWrapping

    loader.load("q-left.glb", function (gltf) {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.isMesh) child.material = baseMat
      })
      mainGroup.add(gltf.scene)
    })
    loader.load("q-right-65.glb", function (gltf) {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.isMesh) child.material = baseMat
      })
      mainGroup.add(gltf.scene)
    })
    loader.load(keycapGLB, function (gltf) {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.isMesh) child.material = keyMat
      })
      mainGroup.add(gltf.scene)
    })

    loader.load(switchGLB, function (gltf) {
      gltf.scene.visible = false
      scene.add(gltf.scene)
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.isMesh) child.material = keyMat
      })
    })

    manager.onLoad = () => {
      const { left, right } = geometry
      const leftSwitches = createKeys(left)
      const rightSwitches = createKeys(right)

      mainGroup.add(leftSwitches)
      mainGroup.add(rightSwitches)

      scene.add(mainGroup)

      setKeyboardToCenter()
    }
  }

  const gui = new GUI()
  gui
    .add(params, "envMapRotation", 0, 360)
    .step(1)
    .onChange((value) => {
      const euler = new THREE.Euler(0, MathUtils.degToRad(value), 0)
      keyMat.envMapRotation = euler
      baseMat.envMapRotation = euler
    })
  gui.add(params, "envMapIntensity", 0, 1).onChange((value) => {
    keyMat.envMapIntensity = value
    baseMat.envMapIntensity = value
  })
  gui.open()

  window.addEventListener("resize", onWindowResize)
}

function createKeys(switchData: SwitchData) {
  const _switchMesh = scene.getObjectByName("switch")
  const keebGroup = new THREE.Group()
  const keysGroup = new THREE.Group()
  const switch3DMap = new THREE.Object3D()
  let switchInstancedMesh: THREE.InstancedMesh

  if (switchData && _switchMesh) {
    const { rows, mx } = switchData

    Object.keys(rows).forEach((row) => {
      const _keycapMesh = scene.getObjectByName(row)
      if (_keycapMesh && _keycapMesh instanceof THREE.Mesh) {
        const keycapMesh = new THREE.InstancedMesh(_keycapMesh.geometry.clone(), keyMat, rows[row].length)
        keycapMesh.name = row
        keycapMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
        keysGroup.add(keycapMesh)
      }
    })

    if (_switchMesh instanceof THREE.Mesh) {
      switchInstancedMesh = new THREE.InstancedMesh(_switchMesh.geometry.clone(), baseMat, mx.length)
      switchInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

      for (let i = 0; i < switchData.mx.length; i++) {
        const { mx, rows } = switchData
        switch3DMap.position.set(mx[i].x, mx[i].y, mx[i].z)
        switch3DMap.updateMatrix()

        keysGroup.children.forEach((mesh) => {
          if (mesh instanceof THREE.InstancedMesh && rows[mesh.name].matrix[i]) {
            mesh.setMatrixAt(rows[mesh.name].matrix[i] - 1, switch3DMap.matrix)
          }
        })
        switchInstancedMesh.setMatrixAt(i, switch3DMap.matrix)
      }

      keebGroup.add(switchInstancedMesh)
      keebGroup.add(keysGroup)
    }
  }

  return keebGroup
}

function setKeyboardToCenter() {
  centerBox.setFromObject(mainGroup)
  centerBox.getCenter(centerVector)
  mainGroup.position.x -= centerVector.x
}

function setCameraFOV() {
  // https://discourse.threejs.org/t/keeping-an-object-scaled-based-on-the-bounds-of-the-canvas-really-battling-to-explain-this-one/17574/10
  const aspectRatio = 0.5
  const cameraHeight = Math.tan(MathUtils.degToRad(fov / 2))
  const ratio = camera.aspect / aspectRatio
  const newCameraHeight = cameraHeight / ratio
  camera.fov = MathUtils.radToDeg(Math.atan(newCameraHeight)) * 2
  camera.updateProjectionMatrix()
}

function onWindowResize() {
  if (canvas) {
    const width = window.innerWidth
    const height = window.innerHeight
    camera.aspect = width / height

    setCameraFOV()

    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }
}

function animate() {
  renderer.render(scene, camera)
}
