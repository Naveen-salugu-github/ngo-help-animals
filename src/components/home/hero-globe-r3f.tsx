"use client"

import { Canvas } from "@react-three/fiber"
import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { GlobeScene } from "@/components/3d/GlobeScene"
import { GlobeInputContext } from "@/components/3d/GlobeInputContext"
import { useHomeScrollProgress } from "@/components/3d/hooks/useHomeScrollProgress"
import { usePointerParallax } from "@/components/3d/hooks/usePointerParallax"
import { motion } from "framer-motion"

export function HeroGlobeFallback() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden opacity-[0.42] md:opacity-[0.5]"
      aria-hidden
    >
      <motion.div
        className="relative h-[min(72vw,420px)] w-[min(72vw,420px)] rounded-full bg-gradient-to-br from-emerald-200/80 via-sky-200/70 to-violet-200/80 blur-2xl"
        animate={{ scale: [1, 1.06, 1], rotate: [0, 4, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-[min(48vw,280px)] w-[min(48vw,280px)] rounded-full border border-primary/20 bg-background/20 shadow-xl backdrop-blur-md"
        style={{ marginTop: "6%" }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}

export function HeroGlobeR3f() {
  const scroll = useHomeScrollProgress()
  const pointer = usePointerParallax()
  const hover = useRef(0)
  const [useWebgl, setUseWebgl] = useState<boolean | null>(null)
  const [loadDog, setLoadDog] = useState(false)
  const [dpr, setDpr] = useState<[number, number]>([1, 1.35])

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const coarse = window.matchMedia("(pointer: coarse)").matches
    const narrow = window.innerWidth < 680
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
    const mem = nav.deviceMemory
    const lowMem = mem != null && mem <= 4
    const save = nav.connection?.saveData === true

    const staticOnly = reduce || narrow || save || (coarse && lowMem)
    setUseWebgl(!staticOnly)

    if (staticOnly) return

    const max = Math.min(window.devicePixelRatio, coarse ? 1.35 : 1.85)
    setDpr([1, max])

    let idleId = 0
    let timeoutId = 0
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => setLoadDog(true), { timeout: 8000 })
    } else {
      timeoutId = window.setTimeout(() => setLoadDog(true), 5000)
    }

    return () => {
      if (idleId) window.cancelIdleCallback(idleId)
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [])

  const ctx = useMemo(() => ({ pointer, scroll, hover }), [pointer, scroll, hover])

  if (useWebgl === null) {
    return null
  }

  if (!useWebgl) {
    return <HeroGlobeFallback />
  }

  return (
    <GlobeInputContext.Provider value={ctx}>
      <div
        className="pointer-events-none fixed inset-0 z-0 h-[100dvh] w-full overflow-hidden opacity-[0.48] md:opacity-[0.56]"
        aria-hidden
      >
        <Canvas
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          dpr={dpr}
          shadows
          camera={{ position: [0.28, 0.52, 2.72], fov: 38, near: 0.1, far: 100 }}
        >
          <Suspense fallback={null}>
            <GlobeScene loadDog={loadDog} />
          </Suspense>
        </Canvas>
      </div>
    </GlobeInputContext.Provider>
  )
}
