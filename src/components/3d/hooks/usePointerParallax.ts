"use client"

import { useEffect, useRef } from "react"

export type PointerRef = { x: number; y: number }

/**
 * Normalized pointer in [-1, 1] for subtle camera / particle parallax.
 */
export function usePointerParallax(opts?: { disabled?: boolean }) {
  const pointer = useRef<PointerRef>({ x: 0, y: 0 })

  useEffect(() => {
    if (opts?.disabled) return
    const coarse = window.matchMedia("(pointer: coarse)").matches
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (coarse || reduce) return

    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [opts?.disabled])

  return pointer
}
