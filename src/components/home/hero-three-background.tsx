"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const MODEL_URL = "/models/dog.glb"
const DRACO_DECODER = "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"

/**
 * Hero WebGL backdrop: GLTF dog (Draco-compressed), IBL + shadows, scroll-scrubbed
 * rotation/camera and subtle pointer parallax. Skips heavy motion when prefers-reduced-motion.
 */
export function HeroThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const section = mount.parentElement
    if (!section) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isCoarse = window.matchMedia("(pointer: coarse)").matches
    const maxDpr = isCoarse ? 1.35 : 2

    let scrollProgress = 0
    const pointer = { x: 0, y: 0 }

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.022)

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
    camera.position.set(0.42, 0.78, 3.35)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isCoarse,
      powerPreference: "high-performance",
    })
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.035).texture
    scene.environment = envTexture
    scene.environmentIntensity = 0.95
    pmremGenerator.dispose()

    const ambient = new THREE.AmbientLight(0xffffff, 0.32)
    scene.add(ambient)

    const key = new THREE.DirectionalLight(0xfff4e6, 2.4)
    key.position.set(3.2, 7, 4.5)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.bias = -0.00015
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 22
    key.shadow.camera.left = -4
    key.shadow.camera.right = 4
    key.shadow.camera.top = 4
    key.shadow.camera.bottom = -4
    scene.add(key)

    const rim = new THREE.DirectionalLight(0xc4b5fd, 0.95)
    rim.position.set(-3, 3.5, -3)
    scene.add(rim)

    const fill = new THREE.PointLight(0xffc8a0, 0.55, 12)
    fill.position.set(1.2, 1.1, 1)
    scene.add(fill)

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 64),
      new THREE.MeshStandardMaterial({
        color: 0xe8e4dc,
        roughness: 1,
        metalness: 0,
        transparent: true,
        opacity: 0.28,
      })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.015
    ground.receiveShadow = true
    scene.add(ground)

    const modelRoot = new THREE.Group()
    scene.add(modelRoot)

    const loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER)
    loader.setDRACOLoader(dracoLoader)

    let mixer: THREE.AnimationMixer | null = null
    let model: THREE.Object3D | null = null
    let running = true
    let frameId = 0
    const clock = new THREE.Clock()

    const resize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (w < 2 || h < 2) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      const dpr = Math.min(window.devicePixelRatio, maxDpr)
      renderer.setPixelRatio(dpr)
      renderer.setSize(w, h, false)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(mount)
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.cssText =
      "display:block;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity 0.7s ease"
    resize()

    let scrollTrigger: ScrollTrigger | null = null
    if (!reduceMotion) {
      scrollTrigger = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.85,
        onUpdate: (self) => {
          scrollProgress = self.progress
        },
      })
    }

    const onPointerMove = (e: PointerEvent) => {
      if (reduceMotion || isCoarse) return
      const rect = section.getBoundingClientRect()
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom
      if (!inside) {
        pointer.x *= 0.94
        pointer.y *= 0.94
        return
      }
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1
    }
    if (!reduceMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true })
    }

    loader.load(
      MODEL_URL,
      (gltf) => {
        model = gltf.scene
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
            const mat = child.material
            if (mat && !Array.isArray(mat)) {
              const m = mat as THREE.MeshStandardMaterial
              if (m.map) m.map.colorSpace = THREE.SRGBColorSpace
            }
          }
        })

        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z, 1e-6)
        const scale = 1.65 / maxDim
        model.scale.multiplyScalar(scale)
        box.setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        model.position.sub(center)
        model.position.y += 0.06

        modelRoot.add(model)

        if (gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model)
          const action = mixer.clipAction(gltf.animations[0])
          action.reset().play()
          if (reduceMotion) {
            action.paused = true
            action.time = 0.12 * gltf.animations[0].duration
          }
        }

        requestAnimationFrame(() => {
          renderer.domElement.style.opacity = "1"
        })
      },
      undefined,
      (err) => {
        console.error("[HeroThreeBackground] Failed to load model:", err)
      }
    )

    const animate = () => {
      if (!running) return
      frameId = requestAnimationFrame(animate)
      const delta = Math.min(clock.getDelta(), 0.05)
      const t = clock.elapsedTime

      if (mixer) {
        if (reduceMotion) {
          mixer.update(0)
        } else {
          mixer.timeScale = 0.28 + scrollProgress * 0.85
          mixer.update(delta)
        }
      }

      if (model) {
        if (!reduceMotion) {
          const targetYaw = Math.PI * 0.12 + scrollProgress * Math.PI * 1.45 + pointer.x * 0.42
          modelRoot.rotation.y += (targetYaw - modelRoot.rotation.y) * 0.065
          modelRoot.rotation.x = THREE.MathUtils.lerp(modelRoot.rotation.x, pointer.y * 0.07, 0.08)
          modelRoot.position.y = Math.sin(t * 0.85) * 0.025
        } else {
          modelRoot.rotation.y = Math.PI * 0.12
          modelRoot.rotation.x = 0
          modelRoot.position.y = 0
        }
      }

      if (!reduceMotion) {
        const camTargetX = 0.38 + scrollProgress * 0.55 + pointer.x * 0.22
        const camTargetY = 0.76 + pointer.y * 0.1
        const camTargetZ = 3.25 + scrollProgress * 0.35
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTargetX, 0.05)
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, camTargetY, 0.05)
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetZ, 0.04)
      }
      camera.lookAt(0, 0.32, 0)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      running = false
      cancelAnimationFrame(frameId)
      scrollTrigger?.kill()
      window.removeEventListener("pointermove", onPointerMove)
      ro.disconnect()
      dracoLoader.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
      renderer.dispose()
      envTexture.dispose()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          const m = obj.material
          if (Array.isArray(m)) m.forEach((x) => x.dispose())
          else m.dispose()
        }
      })
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-[0.58] md:opacity-[0.72]"
      aria-hidden
    />
  )
}
