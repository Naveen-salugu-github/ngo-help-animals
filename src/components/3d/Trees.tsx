"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Clone, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { useGlobeInput } from "./GlobeInputContext"

useGLTF.preload("/models/tree.glb")

type Slot = {
  pos: [number, number, number]
  scale: number
  phase: number
}

const slots: Slot[] = [
  { pos: [0.52, 0.38, 0.42], scale: 0.42, phase: 0.2 },
  { pos: [-0.48, 0.22, 0.5], scale: 0.36, phase: 1.1 },
  { pos: [0.12, 0.62, -0.55], scale: 0.4, phase: 0.6 },
  { pos: [-0.22, -0.18, 0.78], scale: 0.32, phase: 2.0 },
  { pos: [0.65, -0.12, -0.35], scale: 0.34, phase: 0.9 },
]

export function Trees() {
  const { scene } = useGLTF("/models/tree.glb")
  const root = useRef<THREE.Group>(null)
  const { scroll, hover } = useGlobeInput()

  useEffect(() => {
    scene.traverse((ch) => {
      if (ch instanceof THREE.Mesh) {
        ch.castShadow = true
        ch.receiveShadow = true
      }
    })
  }, [scene])

  const clones = useMemo(
    () =>
      slots.map((s, i) => ({
        key: i,
        position: new THREE.Vector3(...s.pos).normalize().multiplyScalar(0.96),
        scale: s.scale,
        phase: s.phase,
      })),
    [],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const grow = 0.65 + scroll.current * 0.55 + hover.current * 0.08
    if (!root.current) return
    root.current.children.forEach((ch, i) => {
      const c = clones[i]
      if (!c) return
      const sway = Math.sin(t * 1.15 + c.phase) * 0.07 * (1 + scroll.current * 0.5)
      ch.rotation.z = sway
      ch.rotation.x = Math.sin(t * 0.9 + c.phase) * 0.04
      const sc = c.scale * grow * (1 + hover.current * 0.04)
      ch.scale.setScalar(sc)
    })
  })

  return (
    <group ref={root}>
      {clones.map((c) => (
        <Clone
          key={c.key}
          object={scene}
          position={c.position}
          scale={c.scale}
          rotation={[0, Math.atan2(c.position.x, c.position.z), 0]}
        />
      ))}
    </group>
  )
}
