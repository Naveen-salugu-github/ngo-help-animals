"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Clone, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { useGlobeInput } from "./GlobeInputContext"

useGLTF.preload("/models/cloud.glb")

const CLOUDS = [
  { r: 1.18, y: 0.55, speed: 0.11, phase: 0 },
  { r: 1.22, y: 0.72, speed: -0.09, phase: 1.7 },
  { r: 1.08, y: -0.35, speed: 0.08, phase: 0.8 },
]

export function Clouds() {
  const { scene } = useGLTF("/models/cloud.glb")
  const root = useRef<THREE.Group>(null)
  const { scroll } = useGlobeInput()

  useEffect(() => {
    scene.traverse((ch) => {
      if (ch instanceof THREE.Mesh) {
        ch.castShadow = true
        ch.receiveShadow = true
      }
    })
  }, [scene])

  const bases = useMemo(
    () =>
      CLOUDS.map((c) => ({
        r: c.r,
        y: c.y,
        speed: c.speed,
        phase: c.phase,
        scale: 0.22 + Math.random() * 0.06,
      })),
    [],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!root.current) return
    root.current.children.forEach((ch, i) => {
      const b = bases[i]
      if (!b) return
      const ang = t * b.speed + b.phase + scroll.current * 0.9
      ch.position.set(Math.cos(ang) * b.r, b.y + Math.sin(t * 0.4 + i) * 0.04, Math.sin(ang) * b.r)
      ch.rotation.y = ang * 0.4
    })
  })

  return (
    <group ref={root}>
      {bases.map((b, i) => (
        <Clone key={i} object={scene} scale={b.scale} />
      ))}
    </group>
  )
}
