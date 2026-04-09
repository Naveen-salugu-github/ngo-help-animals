"use client"

import { useEffect, useRef } from "react"
import type { AnimationClip, Object3D } from "three"

/** Custom dog GLB (`public/models/dog.glb`, ~23MB — textures embedded; may have no clips) */
const DOG_URL = "/models/dog.glb"
/** Bicolor cat GLB (`public/models/cat.glb`, ~3.8MB — textures embedded; clip often named `Animation`) */
const CAT_URL = "/models/cat.glb"
/** Same-origin HDRI (~1.6MB) */
const HDR_URL = "/hdri/brown_photostudio_02_1k.hdr"

function pickIdleClip(animations: AnimationClip[]) {
  const prefer = [
    "Idle",
    "AnimalArmature|Idle",
    "CharacterArmature|Idle",
    "Idle_2",
    "Animation",
  ]
  for (const name of prefer) {
    const c = animations.find((a) => a.name === name)
    if (c) return c
  }
  return animations[0] ?? null
}

type ThreeModule = typeof import("three")

type LoadedGltfPet = { scene: Object3D; animations: AnimationClip[] }

function preparePet(THREE: ThreeModule, gltf: LoadedGltfPet) {
  const model = gltf.scene
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true
      child.receiveShadow = true
      const mat = child.material
      if (mat && !Array.isArray(mat)) {
        const m = mat as InstanceType<typeof THREE.MeshStandardMaterial>
        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace
        m.envMapIntensity = 1.05
        if (m.roughness !== undefined) m.roughness = THREE.MathUtils.clamp(m.roughness * 0.92, 0.12, 1)
      }
    }
  })

  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 1e-6)
  const scale = 1.38 / maxDim
  model.scale.multiplyScalar(scale)
  box.setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  model.position.sub(center)
  model.position.y += 0.035

  const group = new THREE.Group()
  group.add(model)
  return { group, model, animations: gltf.animations }
}

/**
 * Full-viewport WebGL: dog + cat GLBs, starts loading immediately on mount.
 */
export function HeroThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scrollRoot = document.querySelector("[data-home-scroll-root]") as HTMLElement | null
    if (!scrollRoot) return

    let cancelled = false
    let cleanup: (() => void) | null = null

    void (async () => {
      const [
        THREE,
        { GLTFLoader },
        { RGBELoader },
        { RoomEnvironment },
        { default: gsap },
        { ScrollTrigger },
      ] = await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/loaders/RGBELoader.js"),
        import("three/examples/jsm/environments/RoomEnvironment.js"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ])

        if (cancelled) return

        gsap.registerPlugin(ScrollTrigger)

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const isCoarse = window.matchMedia("(pointer: coarse)").matches
        const maxDpr = isCoarse ? 1.35 : 2

        let scrollProgress = 0
        const pointer = { x: 0, y: 0 }

        const scene = new THREE.Scene()
        scene.fog = new THREE.FogExp2(0xf8fafc, 0.014)

        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
        camera.position.set(0.35, 0.76, 3.35)

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        })
        renderer.setClearColor(0x000000, 0)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.1
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap

        const pmremGenerator = new THREE.PMREMGenerator(renderer)
        let envMap: InstanceType<typeof THREE.Texture> | null = null

        const ambient = new THREE.AmbientLight(0xffffff, 0.22)
        scene.add(ambient)

        const sun = new THREE.DirectionalLight(0xfff6ed, 1.75)
        sun.position.set(3.5, 8, 4.2)
        sun.castShadow = true
        sun.shadow.mapSize.set(isCoarse ? 1024 : 2048, isCoarse ? 1024 : 2048)
        sun.shadow.bias = -0.00012
        sun.shadow.camera.near = 0.4
        sun.shadow.camera.far = 26
        sun.shadow.camera.left = -5
        sun.shadow.camera.right = 5
        sun.shadow.camera.top = 5
        sun.shadow.camera.bottom = -5
        scene.add(sun)

        const rim = new THREE.DirectionalLight(0xd4c4ff, 0.5)
        rim.position.set(-3.2, 4, -3.8)
        scene.add(rim)

        const spot = new THREE.SpotLight(0xfff0e6, 16, 24, Math.PI / 5.2, 0.4, 1)
        spot.position.set(2.4, 6, 3)
        spot.castShadow = true
        spot.shadow.mapSize.set(isCoarse ? 1024 : 2048, isCoarse ? 1024 : 2048)
        spot.target.position.set(0, 0.22, 0)
        scene.add(spot)
        scene.add(spot.target)

        const fill = new THREE.PointLight(0xffd4b8, 0.4, 16)
        fill.position.set(-1.2, 1.4, 1.5)
        scene.add(fill)

        const ground = new THREE.Mesh(
          new THREE.RingGeometry(0.55, 4.2, 64),
          new THREE.MeshStandardMaterial({
            color: 0xe8e4dc,
            roughness: 1,
            metalness: 0,
            transparent: true,
            opacity: 0.2,
          })
        )
        ground.rotation.x = -Math.PI / 2
        ground.position.y = -0.02
        ground.receiveShadow = true
        scene.add(ground)

        const petsRoot = new THREE.Group()
        scene.add(petsRoot)

        const loader = new GLTFLoader()
        const rgbeLoader = new RGBELoader()

        async function loadEnvironment(): Promise<InstanceType<typeof THREE.Texture>> {
          try {
            const hdr = await rgbeLoader.loadAsync(HDR_URL)
            hdr.mapping = THREE.EquirectangularReflectionMapping
            const tex = pmremGenerator.fromEquirectangular(hdr).texture
            hdr.dispose()
            return tex
          } catch {
            const room = new RoomEnvironment()
            return pmremGenerator.fromScene(room, 0.04).texture
          }
        }

        let envTex: InstanceType<typeof THREE.Texture>
        let gltfDog: Awaited<ReturnType<typeof loader.loadAsync>>
        let gltfCat: Awaited<ReturnType<typeof loader.loadAsync>>
        try {
          ;[envTex, gltfDog, gltfCat] = await Promise.all([
            loadEnvironment(),
            loader.loadAsync(DOG_URL),
            loader.loadAsync(CAT_URL),
          ])
        } catch (e) {
          console.error("[HeroThreeBackground] Asset load failed:", e)
          pmremGenerator.dispose()
          return
        }

        if (cancelled) {
          envTex.dispose()
          pmremGenerator.dispose()
          return
        }

        pmremGenerator.dispose()
        envMap = envTex
        scene.environment = envMap
        scene.environmentIntensity = 1.02

        const dog = preparePet(THREE, gltfDog)
        const cat = preparePet(THREE, gltfCat)
        cat.group.scale.multiplyScalar(0.8)

        dog.group.position.set(-0.78, 0, 0.06)
        dog.group.rotation.y = 0.22
        cat.group.position.set(0.78, 0, -0.04)
        cat.group.rotation.y = -0.26

        petsRoot.add(dog.group)
        petsRoot.add(cat.group)

        let mixerDog: InstanceType<typeof THREE.AnimationMixer> | null = null
        let mixerCat: InstanceType<typeof THREE.AnimationMixer> | null = null

        const clipDog = pickIdleClip(dog.animations)
        if (clipDog) {
          mixerDog = new THREE.AnimationMixer(dog.model)
          const a = mixerDog.clipAction(clipDog)
          a.reset().play()
          if (reduceMotion) {
            a.paused = true
            a.time = 0.08 * clipDog.duration
          }
        }

        const clipCat = pickIdleClip(cat.animations)
        if (clipCat) {
          mixerCat = new THREE.AnimationMixer(cat.model)
          const a = mixerCat.clipAction(clipCat)
          a.reset().play()
          if (reduceMotion) {
            a.paused = true
            a.time = 0.08 * clipCat.duration
          }
        }

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

        const ro = new ResizeObserver(() => {
          resize()
          ScrollTrigger.refresh()
        })
        ro.observe(mount)
        mount.appendChild(renderer.domElement)
        renderer.domElement.style.cssText =
          "display:block;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity 0.85s ease"
        resize()

        let scrollTrigger: InstanceType<typeof ScrollTrigger> | null = null
        if (!reduceMotion) {
          scrollTrigger = ScrollTrigger.create({
            trigger: scrollRoot,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.15,
            onUpdate: (self) => {
              scrollProgress = self.progress
            },
          })
        }

        const onPointerMove = (e: PointerEvent) => {
          if (reduceMotion || isCoarse) return
          pointer.x = (e.clientX / window.innerWidth) * 2 - 1
          pointer.y = (e.clientY / window.innerHeight) * 2 - 1
        }
        if (!reduceMotion) {
          window.addEventListener("pointermove", onPointerMove, { passive: true })
        }

        requestAnimationFrame(() => {
          renderer.domElement.style.opacity = "1"
          ScrollTrigger.refresh()
        })

        const animate = () => {
          if (!running) return
          frameId = requestAnimationFrame(animate)
          const delta = Math.min(clock.getDelta(), 0.05)
          const t = clock.elapsedTime

          const ts = reduceMotion ? 0 : 0.3 + scrollProgress * 1.0
          if (mixerDog) {
            if (reduceMotion) mixerDog.update(0)
            else {
              mixerDog.timeScale = ts
              mixerDog.update(delta)
            }
          }
          if (mixerCat) {
            if (reduceMotion) mixerCat.update(0)
            else {
              mixerCat.timeScale = ts
              mixerCat.update(delta)
            }
          }

          if (!reduceMotion) {
            const fullTurn = Math.PI * 2
            // Start 50% (180°) rotated from previous initial pose.
            const targetYaw = (-0.30 + Math.PI) + scrollProgress * fullTurn + pointer.x * 0.24
            petsRoot.rotation.y += (targetYaw - petsRoot.rotation.y) * 0.052
            petsRoot.rotation.x = THREE.MathUtils.lerp(petsRoot.rotation.x, pointer.y * 0.045, 0.07)
            petsRoot.position.y = Math.sin(t * 0.62) * 0.016
          } else {
            petsRoot.rotation.y = -0.18 + Math.PI
            petsRoot.rotation.x = 0
            petsRoot.position.y = 0
          }

          if (!reduceMotion) {
            const camTargetX = 0.28 + scrollProgress * 0.58 + pointer.x * 0.16
            const camTargetY = 0.72 + pointer.y * 0.07
            const camTargetZ = 3.05 + scrollProgress * 0.52
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTargetX, 0.044)
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, camTargetY, 0.044)
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetZ, 0.036)
          }
          camera.lookAt(0, 0.24, 0)

          renderer.render(scene, camera)
        }
        animate()

        cleanup = () => {
          running = false
          cancelAnimationFrame(frameId)
          scrollTrigger?.kill()
          window.removeEventListener("pointermove", onPointerMove)
          ro.disconnect()
          if (mount.contains(renderer.domElement)) {
            mount.removeChild(renderer.domElement)
          }
          renderer.dispose()
          if (envMap) envMap.dispose()
          scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              obj.geometry.dispose()
              const m = obj.material
              if (Array.isArray(m)) m.forEach((x) => x.dispose())
              else m.dispose()
            }
          })
        }
    })()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-0 h-[100dvh] w-full overflow-hidden opacity-[0.5] md:opacity-[0.58]"
      aria-hidden
    />
  )
}
