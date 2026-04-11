"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Normalized scroll progress (0–1) over `[data-home-scroll-root]` for WebGL storytelling.
 */
export function useHomeScrollProgress() {
  const progress = useRef(0)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const root = document.querySelector("[data-home-scroll-root]") as HTMLElement | null
    if (!root) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion) {
      progress.current = 0
      return
    }

    const st = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.85,
      onUpdate: (self) => {
        progress.current = self.progress
      },
    })

    return () => {
      st.kill()
    }
  }, [])

  return progress
}
