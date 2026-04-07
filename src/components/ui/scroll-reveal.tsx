"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export type ScrollRevealVariant = "media" | "fade-up"

type Props = {
  children: ReactNode
  variant?: ScrollRevealVariant
  className?: string
  /** Stagger delay in ms (e.g. index * 70 for grid items). */
  delayMs?: number
  /** Intersection threshold 0–1 */
  threshold?: number
  /** Only animate once (default true). */
  once?: boolean
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function ScrollReveal({
  children,
  variant = "fade-up",
  className,
  delayMs = 0,
  threshold = 0.12,
  once = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisible(true)
      return
    }

    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true)
            if (once) obs.disconnect()
          } else if (!once) {
            setVisible(false)
          }
        }
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold }
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [once, threshold])

  const style: CSSProperties | undefined =
    delayMs > 0 ? ({ "--sr-delay": `${delayMs}ms` } as CSSProperties) : undefined

  return (
    <div
      ref={ref}
      data-visible={visible ? true : undefined}
      style={style}
      className={cn(
        variant === "media" && "scroll-reveal scroll-reveal--media",
        variant === "fade-up" && "scroll-reveal scroll-reveal--fade-up",
        className
      )}
    >
      {children}
    </div>
  )
}
