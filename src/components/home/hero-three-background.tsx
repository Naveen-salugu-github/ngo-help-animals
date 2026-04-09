"use client"

import { useEffect, useRef } from "react"
import type { AnimationClip } from "three"

/** Quaternius Shiba Inu (CC0) via Poly Pizza — replace `public/models/dog.glb` with a larger PBR asset anytime */
const MODEL_URL = "/models/dog.glb"
/** Same-origin HDRI (~1.6MB) — avoids blocking on third-party CDN during first paint */
const HDR_URL = "/hdri/brown_photostudio_02_1k.hdr"

function pickIdleClip(animations: AnimationClip[]) {
  const prefer = ["Idle", "AnimalArmature|Idle", "Idle_2"]
  for (const name of prefer) {
    const c = animations.find((a) => a.name === name)
    if (c) return c
  }
  return animations[0] ?? null
}

function scheduleIdle(fn: () => void): number {
  if (typeof requestIdleCallback !== "undefined") {
    return requestIdleCallback(fn, { timeout: 2500 }) as unknown as number
  }
  return window.setTimeout(fn, 120) as unknown as number
}

function cancelScheduled(id: number) {
  if (typeof cancelIdleCallback !== "undefined") {
    cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}

/**
 * Full-viewport WebGL: loads **after** first paint (idle + dynamic imports) so the shell stays snappy.
 * HDR + GLB load in parallel; HDRI is served from `/public` to avoid extra CDN latency.
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

    const idleId = scheduleIdle(() => {
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
        scene.fog = new THREE.FogExp2(0xf8fafc, 0.016)

        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
        camera.position.set(0.35, 0.72, 3.15)

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        })
        renderer.setClearColor(0x000000, 0)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.12
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap

        const pmremGenerator = new THREE.PMREMGenerator(renderer)
        let envMap: InstanceType<typeof THREE.Texture> | null = null

        const ambient = new THREE.AmbientLight(0xffffff, 0.22)
        scene.add(ambient)

        const sun = new THREE.DirectionalLight(0xfff6ed, 1.85)
        sun.position.set(3.5, 8, 4.2)
        sun.castShadow = true
        sun.shadow.mapSize.set(isCoarse ? 1024 : 2048, isCoarse ? 1024 : 2048)
        sun.shadow.bias = -0.00012
        sun.shadow.camera.near = 0.4
        sun.shadow.camera.far = 24
        sun.shadow.camera.left = -4
        sun.shadow.camera.right = 4
        sun.shadow.camera.top = 4
        sun.shadow.camera.bottom = -4
        scene.add(sun)

        const rim = new THREE.DirectionalLight(0xd4c4ff, 0.55)
        rim.position.set(-3.2, 4, -3.8)
        scene.add(rim)

        const spot = new THREE.SpotLight(0xfff0e6, 18, 22, Math.PI / 5.5, 0.38, 1)
        spot.position.set(2.2, 5.8, 2.8)
        spot.castShadow = true
        spot.shadow.mapSize.set(isCoarse ? 1024 : 2048, isCoarse ? 1024 : 2048)
        spot.target.position.set(0, 0.22, 0)
        scene.add(spot)
        scene.add(spot.target)

        const fill = new THREE.PointLight(0xffd4b8, 0.42, 14)
        fill.position.set(-1.2, 1.4, 1.5)
        scene.add(fill)

        const ground = new THREE.Mesh(
          new THREE.RingGeometry(0.65, 3.2, 64),
          new THREE.MeshStandardMaterial({
            color: 0xe8e4dc,
            roughness: 1,
            metalness: 0,
            transparent: true,
            opacity: 0.22,
          })
        )
        ground.rotation.x = -Math.PI / 2
        ground.position.y = -0.02
        ground.receiveShadow = true
        scene.add(ground)

        const modelRoot = new THREE.Group()
        scene.add(modelRoot)

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

        let gltf: Awaited<ReturnType<typeof loader.loadAsync>>
        let envTex: InstanceType<typeof THREE.Texture>
        try {
          ;[envTex, gltf] = await Promise.all([loadEnvironment(), loader.loadAsync(MODEL_URL)])
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

        let mixer: InstanceType<typeof THREE.AnimationMixer> | null = null
        let model: InstanceType<typeof THREE.Object3D> | null = null
        let running = true
        let frameId = 0
        const clock = new THREE.Clock()

        model = gltf.scene
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
        const scale = 1.58 / maxDim
        model.scale.multiplyScalar(scale)
        box.setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        model.position.sub(center)
        model.position.y += 0.04

        modelRoot.add(model)

        const clip = pickIdleClip(gltf.animations)
        if (clip) {
          mixer = new THREE.AnimationMixer(model)
          const action = mixer.clipAction(clip)
          action.reset().play()
          if (reduceMotion) {
            action.paused = true
            action.time = 0.08 * clip.duration
          }
        }

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

          if (mixer) {
            if (reduceMotion) {
              mixer.update(0)
            } else {
              mixer.timeScale = 0.32 + scrollProgress * 1.05
              mixer.update(delta)
            }
          }

          if (model) {
            if (!reduceMotion) {
              const fullTurn = Math.PI * 2
              const targetYaw = -0.28 + scrollProgress * fullTurn + pointer.x * 0.28
              modelRoot.rotation.y += (targetYaw - modelRoot.rotation.y) * 0.055
              modelRoot.rotation.x = THREE.MathUtils.lerp(modelRoot.rotation.x, pointer.y * 0.05, 0.07)
              modelRoot.position.y = Math.sin(t * 0.65) * 0.018
            } else {
              modelRoot.rotation.y = -0.2
              modelRoot.rotation.x = 0
              modelRoot.position.y = 0
            }
          }

          if (!reduceMotion) {
            const camTargetX = 0.32 + scrollProgress * 0.62 + pointer.x * 0.18
            const camTargetY = 0.7 + pointer.y * 0.08
            const camTargetZ = 2.95 + scrollProgress * 0.55
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTargetX, 0.045)
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, camTargetY, 0.045)
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetZ, 0.038)
          }
          camera.lookAt(0, 0.26, 0)

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
    })

    return () => {
      cancelled = true
      cancelScheduled(idleId)
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
