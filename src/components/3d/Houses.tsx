"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Clone, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { useGlobeInput } from "./GlobeInputContext"

useGLTF.preload("/models/house.glb")

const slots: [number, number, number][] = [
  [0.58, -0.28, 0.38],
  [-0.52, -0.22, 0.48],
  [0.05, -0.55, 0.62],
]

export function Houses() {
  const { scene } = useGLTF("/models/house.glb")
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
        pos: new THREE.Vector3(...p).normalize().multiplyScalar(0.88),
        base: 0.32,
      })),
    [],
  )

  useFrame(() => {
    const pop = 0.82 + scroll.current * 0.35 + hover.current * 0.06
    if (!root.current) return
    root.current.children.forEach((ch, i) => {
      const a = anchors[i]
      if (!a) return
      ch.scale.setScalar(a.base * pop)
    })
  })

  return (
    <group ref={root}>
      {anchors.map((a, i) => (
        <Clone
          key={i}
          object={scene}
          position={a.pos}
          rotation={[0, Math.atan2(a.pos.x, a.pos.z) + 0.4, 0]}
        />
      ))}
    </group>
  )
}
