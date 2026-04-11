"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useGlobeInput } from "./GlobeInputContext"

export function WaterRing() {
  const mesh = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshStandardMaterial>(null)
  const { scroll } = useGlobeInput()

  const geom = useMemo(() => {
    const g = new THREE.RingGeometry(0.62, 0.92, 64, 1)
    return g
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (mesh.current) {
      mesh.current.rotation.z = t * 0.12 + scroll.current * 0.8
    }
    if (mat.current) {
      mat.current.opacity = 0.38 + Math.sin(t * 1.8) * 0.06 + scroll.current * 0.12
    }
  })

  return (
    <mesh ref={mesh} geometry={geom} rotation={[Math.PI / 2.35, 0.12, 0]} position={[0, -0.02, 0]}>
      <meshStandardMaterial
        ref={mat}
        color="#5ec8ff"
        emissive="#1a6a8f"
        emissiveIntensity={0.35}
        metalness={0.15}
        roughness={0.35}
        transparent
        opacity={0.42}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
