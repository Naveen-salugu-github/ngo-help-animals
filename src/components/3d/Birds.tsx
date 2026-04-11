"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Clone, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { useGlobeInput } from "./GlobeInputContext"

useGLTF.preload("/models/bird.glb")

const BIRDS = 3

export function Birds() {
  const { scene } = useGLTF("/models/bird.glb")
  const root = useRef<THREE.Group>(null)
  const { scroll } = useGlobeInput()

  useEffect(() => {
    scene.traverse((ch) => {
      if (ch instanceof THREE.Mesh) {
        ch.castShadow = true
        const s = 0.018
        ch.scale.setScalar(s)
      }
    })
  }, [scene])

  const phases = useMemo(() => Array.from({ length: BIRDS }, (_, i) => (i / BIRDS) * Math.PI * 2), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!root.current) return
    root.current.children.forEach((ch, i) => {
      const ph = phases[i] ?? 0
      const r = 1.35 + i * 0.08 + scroll.current * 0.25
      const speed = 0.55 + i * 0.12
      const ang = t * speed + ph + scroll.current * 1.2
      const y = 0.35 + Math.sin(t * 0.7 + ph) * 0.22
      ch.position.set(Math.cos(ang) * r, y, Math.sin(ang) * r)
      ch.rotation.y = ang + Math.PI / 2
    })
  })

  return (
    <group ref={root}>
      {phases.map((_, i) => (
        <Clone key={i} object={scene} />
      ))}
    </group>
  )
}
