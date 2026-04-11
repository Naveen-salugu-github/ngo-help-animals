"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useGlobeInput } from "./GlobeInputContext"

const COUNT = 420

export function Particles({ scrollBoost = 1 }: { scrollBoost?: number }) {
  const pts = useRef<THREE.Points>(null)
  const { pointer, scroll } = useGlobeInput()

  const { positions, phases } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const phases = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const r = 1.55 + Math.random() * 1.85
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.72
      positions[i * 3 + 2] = r * Math.cos(phi)
      phases[i] = Math.random() * Math.PI * 2
    }
    return { positions, phases }
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const s = scroll.current * scrollBoost
    const px = pointer.current.x * 0.14
    const py = pointer.current.y * 0.1
    if (!pts.current) return
    const geo = pts.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = geo.array as Float32Array
    for (let i = 0; i < COUNT; i++) {
      const ph = phases[i]
      const wobble = 0.018 * Math.sin(t * 0.35 + ph)
      const drift = 0.04 * s
      arr[i * 3] = positions[i * 3] + wobble + px * 0.25 + drift * Math.sin(ph)
      arr[i * 3 + 1] = positions[i * 3 + 1] + wobble * 0.8 + py * 0.2 + drift * 0.4
      arr[i * 3 + 2] = positions[i * 3 + 2] + wobble + drift * Math.cos(ph * 0.7)
    }
    geo.needsUpdate = true
    pts.current.rotation.y = t * 0.018 + s * 0.35
  })

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#b8e8ff"
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}
