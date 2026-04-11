"use client"

import { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Environment } from "@react-three/drei"
import * as THREE from "three"
import { GlobeHoverDriver } from "./GlobeHoverDriver"
import { useGlobeInput } from "./GlobeInputContext"
import { Trees } from "./Trees"
import { Plants } from "./Plants"
import { Houses } from "./Houses"
import { Clouds } from "./Clouds"
import { Birds } from "./Birds"
import { Animals } from "./Animals"
import { Particles } from "./Particles"
import { WaterRing } from "./WaterRing"

function ScrollCameraRig() {
  const { camera } = useThree()
  const { pointer, scroll } = useGlobeInput()

  useFrame(() => {
    const px = pointer.current.x
    const py = pointer.current.y
    const s = scroll.current
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0.26 + s * 0.5 + px * 0.15, 0.055)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.52 + py * 0.09, 0.055)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 2.72 + s * 0.48, 0.048)
    camera.lookAt(0, 0.1, 0)
  })

  return null
}

export function GlobeScene({ loadDog }: { loadDog: boolean }) {
  const globe = useRef<THREE.Group>(null)
  const { pointer, scroll } = useGlobeInput()

  useFrame((_, delta) => {
    if (!globe.current) return
    const s = scroll.current
    globe.current.rotation.y += delta * (0.1 + s * 0.12)
    globe.current.rotation.x = THREE.MathUtils.lerp(globe.current.rotation.x, pointer.current.y * 0.07, 0.06)
    globe.current.rotation.z = THREE.MathUtils.lerp(globe.current.rotation.z, pointer.current.x * 0.05, 0.06)
  })

  return (
    <>
      <ScrollCameraRig />
      <GlobeHoverDriver />

      <fogExp2 attach="fog" args={["#eef6ff", 0.018]} />

      <ambientLight intensity={0.32} />
      <directionalLight
        castShadow
        position={[3.4, 7.5, 3.8]}
        intensity={1.55}
        color="#fff6ed"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-camera-far={22}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[-3.2, 4.2, -3.4]} intensity={0.42} color="#d4c4ff" />
      <pointLight position={[-1.1, 1.35, 1.4]} intensity={0.35} color="#ffd4b8" distance={16} />

      <Environment files="/hdri/brown_photostudio_02_1k.hdr" environmentIntensity={0.95} />

      <group ref={globe}>
        <mesh castShadow receiveShadow>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial
            color="#7ecf8e"
            emissive="#1f5c3a"
            emissiveIntensity={0.12}
            roughness={0.78}
            metalness={0.06}
          />
        </mesh>

        <WaterRing />
        <Trees />
        <Plants />
        <Houses />
        <Clouds />
        <Birds />
        <Animals loadDog={loadDog} />
      </group>

      <Particles scrollBoost={1.15} />
    </>
  )
}
