"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Clone, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { useGlobeInput } from "./GlobeInputContext"

useGLTF.preload("/models/plant.glb")

const slots: [number, number, number][] = [
  [0.42, 0.12, 0.62],
  [-0.38, 0.18, 0.58],
  [0.68, 0.08, -0.28],
  [-0.55, 0.42, -0.35],
]

export function Plants() {
  const { scene } = useGLTF("/models/plant.glb")
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

  const anchors = useMemo(
    () =>
      slots.map((p) => ({
        pos: new THREE.Vector3(...p).normalize().multiplyScalar(0.92),
        base: 0.34,
      })),
    [],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const grow = 0.75 + scroll.current * 0.5 + hover.current * 0.05
    if (!root.current) return
    root.current.children.forEach((ch, i) => {
      const a = anchors[i]
      if (!a) return
      ch.scale.setScalar(a.base * grow * (1 + Math.sin(t * 1.4 + i) * 0.04))
      ch.rotation.y = t * 0.15 + i
    })
  })

  return (
    <group ref={root}>
      {anchors.map((a, i) => (
        <Clone
          key={i}
          object={scene}
          position={a.pos}
          rotation={[0, Math.atan2(a.pos.x, a.pos.z), 0]}
        />
      ))}
    </group>
  )
}
