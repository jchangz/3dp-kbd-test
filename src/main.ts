import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js"
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { GainMapLoader } from "@monogrid/gainmap-js"
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
  envMap: "Room",
  envMapRotation: 0,
  envMapIntensity: 1,
  keyTextureRepeat: 10,
  keyColor: "#171718",
  caseColor: "#171718",
}

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
const keyboardGLBArr = ["t1-q-left.glb", "t1-q-right-65.glb"]

let roomEnv: THREE.Texture
let studioEnv: THREE.Texture

let keyNormal: THREE.Texture
let keyRoughness: THREE.Texture
let caseNormal: THREE.Texture
let caseAO: THREE.Texture
let caseRoughness: THREE.Texture
let caseFaceNormal: THREE.Texture

const envMapRotation = new THREE.Euler(0, MathUtils.degToRad(params.envMapRotation), 0)

const keyMat = new THREE.MeshStandardMaterial({
  color: params.keyColor,
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
const caseMat = new THREE.MeshStandardMaterial({
  color: params.caseColor,
  roughness: 0.5,
  envMapIntensity: params.envMapIntensity,
  envMapRotation: envMapRotation,
})
const faceMat = new THREE.MeshStandardMaterial({
  color: params.caseColor,
  roughness: 0.4,
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
    roomEnv = pmremGenerator.fromScene(environment).texture

    const gainMap = new GainMapLoader(renderer).load(
      ["gainmap/studio.webp", "gainmap/studio-gainmap.webp", "gainmap/studio.json"],
      function (texture) {
        const gainMapBackground = texture.renderTarget.texture
        gainMapBackground.mapping = THREE.EquirectangularReflectionMapping
        gainMapBackground.needsUpdate = true
        const gainMapPMREMRenderTarget = pmremGenerator.fromEquirectangular(gainMapBackground)

        studioEnv = gainMapPMREMRenderTarget.texture
        gainMap.dispose()
      }
    )

    camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.set(0, 6, 12)
    setCameraFOV()

    controls = new OrbitControls(camera, renderer.domElement)

    const texloader = new THREE.TextureLoader(manager)

    keyNormal = texloader.load("textures/key_normal.webp")
    keyNormal.repeat.set(params.keyTextureRepeat, params.keyTextureRepeat)
    keyMat.normalMap = keyNormal

    keyRoughness = texloader.load("textures/key_roughness.webp")
    keyRoughness.repeat.set(params.keyTextureRepeat, params.keyTextureRepeat)
    keyMat.roughnessMap = keyRoughness

    caseNormal = texloader.load("textures/3dp_normal.webp")
    caseNormal.repeat.set(0, 3)
    caseMat.normalMap = caseNormal

    caseRoughness = texloader.load("textures/3dp_roughness.webp")
    caseRoughness.repeat.set(0, 3)
    caseMat.roughnessMap = caseRoughness

    caseAO = texloader.load("textures/3dp_ao.webp")
    caseAO.repeat.set(0, 3)
    caseMat.aoMap = caseAO

    caseFaceNormal = texloader.load("textures/3dp_face.webp")
    caseFaceNormal.repeat.set(25, 25)
    faceMat.normalMap = caseFaceNormal

    keyNormal.wrapS =
      keyNormal.wrapT =
      keyRoughness.wrapS =
      keyRoughness.wrapT =
      caseNormal.wrapS =
      caseNormal.wrapT =
      caseRoughness.wrapS =
      caseRoughness.wrapT =
      caseAO.wrapS =
      caseAO.wrapT =
      caseFaceNormal.wrapS =
      caseFaceNormal.wrapT =
        THREE.RepeatWrapping

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

    keyboardGLBArr.forEach((kb) =>
      loader.load(`models/${kb}`, function (gltf) {
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh && child.isMesh) {
            if (child.name.includes("_2")) child.material = faceMat
            else child.material = caseMat
          }
        })
        mainGroup.add(gltf.scene)
      })
    )

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
  const envGUI = gui.addFolder("Environment")
  envGUI.add(params, "envMap", ["Room", "Studio"]).name("Environment")
  envGUI
    .add(params, "envMapRotation", 0, 360)
    .step(1)
    .onChange((value) => {
      const euler = new THREE.Euler(0, MathUtils.degToRad(value), 0)
      keyMat.envMapRotation = euler
      baseMat.envMapRotation = euler
      caseMat.envMapRotation = euler
      faceMat.envMapRotation = euler
      caseMat.needsUpdate = true
      faceMat.needsUpdate = true
    })
  envGUI.add(params, "envMapIntensity", 0, 1).onChange((value) => {
    keyMat.envMapIntensity = value
    baseMat.envMapIntensity = value
    caseMat.envMapIntensity = value
    faceMat.envMapIntensity = value
  })

  const caseGUI = gui.addFolder("Case")
  caseGUI
    .addColor(params, "caseColor")
    .name("color")
    .onChange((value) => {
      caseMat.color.set(value)
      faceMat.color.set(value)
    })
  caseGUI.add(caseMat, "roughness", 0, 1)
  caseGUI.add(caseMat, "metalness", 0, 1)

  const keycapGUI = gui.addFolder("Keycaps")
  keycapGUI
    .addColor(params, "keyColor")
    .name("color")
    .onChange((value) => {
      keyMat.color.set(value)
    })
  keycapGUI.add(keyMat, "roughness", 0, 1)
  keycapGUI.add(keyMat, "metalness", 0, 1)
  keycapGUI
    .add(params, "keyTextureRepeat", 1, 10)
    .step(1)
    .onChange((value) => {
      keyNormal.repeat.set(value, value)
      keyRoughness.repeat.set(value, value)
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
  switch (params.envMap) {
    case "Room":
      keyMat.envMap = roomEnv
      baseMat.envMap = roomEnv
      caseMat.envMap = roomEnv
      faceMat.envMap = roomEnv
      break
    case "Studio":
      keyMat.envMap = studioEnv
      baseMat.envMap = studioEnv
      caseMat.envMap = studioEnv
      faceMat.envMap = studioEnv
      break
  }

  renderer.render(scene, camera)
}
