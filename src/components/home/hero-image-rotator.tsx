"use client"

import { useEffect, useState } from "react"

/** Last two: Unsplash YfNRdlxHDwI (cats on step), Rwx2wnnAiCE (feeding stray dog, India). */
const IMAGES = [
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=900&q=80",
  "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=900&q=80",
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=900&q=80",
  "https://images.unsplash.com/photo-1699525187657-7ad6c07c4d74?w=900&q=80",
  "https://images.unsplash.com/photo-1674802401345-4e6ec9fc2146?w=900&q=80",
]

const INTERVAL_MS = 3000

export function HeroImageRotator() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % IMAGES.length)
    }, INTERVAL_MS)
    return () => window.clearInterval(t)
  }, [])

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-md flex-1 overflow-hidden rounded-2xl border bg-muted shadow-xl md:max-w-lg">
      {IMAGES.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`hero-${i}`}
          src={src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          fetchPriority={i === 0 ? "high" : "low"}
        />
      ))}
      <div
        className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-background/80 px-2 py-1 backdrop-blur"
        aria-hidden
      >
        {IMAGES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? "bg-primary" : "bg-muted-foreground/40"}`}
          />
        ))}
      </div>
    </div>
  )
}
