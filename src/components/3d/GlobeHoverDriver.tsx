"use client"

import { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useGlobeInput } from "./GlobeInputContext"

const raycaster = new THREE.Raycaster()

/**
 * Single raycast per frame → writes `hover` ref on context (0–1).
 */
export function GlobeHoverDriver({ globeRadius = 1.05 }: { globeRadius?: number }) {
  const strength = useRef(0)
  const { camera } = useThree()
  const { pointer, hover } = useGlobeInput()
  const ndc = useRef(new THREE.Vector2())

  useFrame(() => {
    ndc.current.set(pointer.current.x, pointer.current.y)
    raycaster.setFromCamera(ndc.current, camera)
    const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), globeRadius)
    const hit = new THREE.Vector3()
    if (raycaster.ray.intersectSphere(sphere, hit)) {
      strength.current += (1 - strength.current) * 0.085
    } else {
      strength.current += (0 - strength.current) * 0.065
    }
    hover.current = strength.current
  })

  return null
}
