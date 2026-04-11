"use client"

import { useEffect, useRef, Suspense } from "react"
import { useFrame } from "@react-three/fiber"
import { useAnimations, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { useGlobeInput } from "./GlobeInputContext"

useGLTF.preload("/models/cat.glb")

const CAT_URL = "/models/cat.glb"
const DOG_URL = "/models/dog.glb"

function pickIdleClip(names: string[], animations: THREE.AnimationClip[]) {
  for (const name of names) {
    const c = animations.find((a) => a.name === name)
    if (c) return c
  }
  return animations[0] ?? null
}

function preparePet(model: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 1e-6)
  const scale = 1.15 / maxDim
  model.scale.multiplyScalar(scale)
  box.setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  model.position.sub(center)
  model.position.y += 0.02
}

function CatModel() {
  const { scene, animations } = useGLTF(CAT_URL)
  const ref = useRef<THREE.Group>(null)
  const { actions, mixer } = useAnimations(animations, ref)
  const { scroll, hover } = useGlobeInput()

  useEffect(() => {
    if (!(scene.userData as { __heroPet?: boolean }).__heroPet) {
      preparePet(scene)
      scene.scale.multiplyScalar(0.78)
      ;(scene.userData as { __heroPet?: boolean }).__heroPet = true
    }
    scene.traverse((ch) => {
      if (ch instanceof THREE.Mesh) {
        ch.castShadow = true
        ch.receiveShadow = true
        const m = ch.material
        if (m && !Array.isArray(m) && "envMapIntensity" in m) {
          ;(m as THREE.MeshStandardMaterial).envMapIntensity = 1.05
        }
      }
    })
    const clip = pickIdleClip(["Idle", "AnimalArmature|Idle", "CharacterArmature|Idle", "Animation"], animations)
    if (clip && actions[clip.name]) {
      actions[clip.name]!.reset().fadeIn(0.35).play()
    }
    return () => {
      mixer.stopAllAction()
    }
  }, [actions, animations, mixer, scene])

  useFrame((_, delta) => {
    const ts = 0.35 + scroll.current * 0.95 + hover.current * 0.18
    mixer.timeScale = ts
    mixer.update(delta)
    if (ref.current) {
      ref.current.rotation.y = -0.35 + scroll.current * 0.5
      ref.current.position.x = 0.62 + hover.current * 0.045
      ref.current.position.y = 0.08 + Math.sin(performance.now() * 0.0011) * 0.012
    }
  })

  return <primitive ref={ref} object={scene} position={[0.62, 0.08, 0.42]} />
}

function DogModel() {
  const { scene, animations } = useGLTF(DOG_URL)
  const ref = useRef<THREE.Group>(null)
  const { actions, mixer } = useAnimations(animations, ref)
  const { scroll, hover } = useGlobeInput()

  useEffect(() => {
    if (!(scene.userData as { __heroPet?: boolean }).__heroPet) {
      preparePet(scene)
      ;(scene.userData as { __heroPet?: boolean }).__heroPet = true
    }
    scene.traverse((ch) => {
      if (ch instanceof THREE.Mesh) {
        ch.castShadow = true
        ch.receiveShadow = true
        const m = ch.material
        if (m && !Array.isArray(m) && "envMapIntensity" in m) {
          ;(m as THREE.MeshStandardMaterial).envMapIntensity = 1.02
        }
      }
    })
    const clip = pickIdleClip(["Idle", "AnimalArmature|Idle", "CharacterArmature|Idle", "Animation"], animations)
    if (clip && actions[clip.name]) {
      actions[clip.name]!.reset().fadeIn(0.45).play()
    }
    return () => {
      mixer.stopAllAction()
    }
  }, [actions, animations, mixer, scene])

  useFrame((_, delta) => {
    const ts = 0.32 + scroll.current * 0.85 + hover.current * 0.14
    mixer.timeScale = ts
    mixer.update(delta)
    if (ref.current) {
      ref.current.rotation.y = 0.28 - scroll.current * 0.35
      ref.current.position.x = -0.64 - hover.current * 0.04
    }
  })

  return <primitive ref={ref} object={scene} position={[-0.64, 0.06, 0.38]} />
}

export function Animals({ loadDog }: { loadDog: boolean }) {
  const group = useRef<THREE.Group>(null)
  const { hover } = useGlobeInput()

  useFrame(() => {
    if (group.current) {
      const h = hover.current * 0.035
      group.current.scale.setScalar(1 + h)
    }
  })

  return (
    <group ref={group}>
      <Suspense fallback={null}>
        <CatModel />
      </Suspense>
      {loadDog ? (
        <Suspense fallback={null}>
          <DogModel />
        </Suspense>
      ) : null}
    </group>
  )
}
