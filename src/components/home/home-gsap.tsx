"use client"

import { useLayoutEffect, useRef, type ReactNode } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

type Props = { children: ReactNode }

/**
 * Scroll-driven fades for elements with `data-gsap-reveal`.
 * Respects prefers-reduced-motion (no animation, content stays visible).
 */
export function HomeGsap({ children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const nodes = root.querySelectorAll<HTMLElement>("[data-gsap-reveal]")
        nodes.forEach((el) => {
          gsap.set(el, { opacity: 0, y: 44 })
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          })
        })
      })
    }, root)

    return () => {
      ctx.revert()
      mm.revert()
    }
  }, [])

  return (
    <div ref={rootRef} className="home-gsap-root">
      {children}
    </div>
  )
}
