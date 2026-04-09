"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

/**
 * Subtle Three.js layer behind the hero: low-poly “stray” dog silhouette with gentle motion.
 * Skips WebGL when prefers-reduced-motion is set.
 */
export function HeroThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion) return

    const isCoarse = window.matchMedia("(pointer: coarse)").matches
    const maxDpr = isCoarse ? 1.25 : 2

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.045)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 1.1, 4.2)
    camera.lookAt(0, 0.35, 0)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isCoarse,
      powerPreference: "low-power",
    })
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const ambient = new THREE.AmbientLight(0xffffff, 0.55)
    scene.add(ambient)
    const key = new THREE.DirectionalLight(0xfff4e6, 0.9)
    key.position.set(3, 6, 4)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xc4b5fd, 0.35)
    fill.position.set(-4, 2, -2)
    scene.add(fill)

    const dog = new THREE.Group()

    const fur = new THREE.MeshStandardMaterial({
      color: 0x9a7b5c,
      roughness: 0.85,
      metalness: 0.05,
    })
    const dark = new THREE.MeshStandardMaterial({
      color: 0x5c4a3a,
      roughness: 0.9,
      metalness: 0,
    })

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.52, 0.62), fur)
    body.position.y = 0.35
    dog.add(body)

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.5), fur)
    chest.position.set(0.45, 0.32, 0)
    dog.add(chest)

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.4), fur)
    head.position.set(0.85, 0.52, 0)
    dog.add(head)

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.22), dark)
    snout.position.set(1.08, 0.48, 0)
    dog.add(snout)

    const earL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.08), dark)
    earL.position.set(0.78, 0.72, 0.14)
    dog.add(earL)
    const earR = earL.clone()
    earR.position.z = -0.14
    dog.add(earR)

    const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.38, 8)
    const legFL = new THREE.Mesh(legGeo, dark)
    legFL.position.set(0.35, 0.12, 0.18)
    dog.add(legFL)
    const legFR = legFL.clone()
    legFR.position.z = -0.18
    dog.add(legFR)
    const legBL = legFL.clone()
    legBL.position.set(-0.35, 0.12, 0.18)
    dog.add(legBL)
    const legBR = legBL.clone()
    legBR.position.z = -0.18
    dog.add(legBR)

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 0.55, 6), dark)
    tail.rotation.z = Math.PI / 2.4
    tail.position.set(-0.72, 0.48, 0)
    dog.add(tail)

    dog.rotation.y = -0.35
    scene.add(dog)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 8),
      new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 1, metalness: 0, transparent: true, opacity: 0.12 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.02
    scene.add(floor)

    let frame = 0
    let running = true
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
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;pointer-events:none"
    resize()

    const animate = () => {
      if (!running) return
      frame = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      dog.position.x = Math.sin(t * 0.35) * 0.15
      dog.position.y = Math.sin(t * 0.8) * 0.04
      dog.rotation.y = -0.35 + Math.sin(t * 0.25) * 0.12

      tail.rotation.y = Math.sin(t * 6) * 0.35
      legFL.rotation.x = Math.sin(t * 3) * 0.12
      legFR.rotation.x = Math.sin(t * 3 + Math.PI) * 0.12
      legBL.rotation.x = Math.sin(t * 3 + Math.PI) * 0.12
      legBR.rotation.x = Math.sin(t * 3) * 0.12

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      running = false
      cancelAnimationFrame(frame)
      ro.disconnect()
      mount.removeChild(renderer.domElement)
      renderer.dispose()
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
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-40 md:opacity-55"
      aria-hidden
    />
  )
}
