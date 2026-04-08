"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type Item = { url: string; type: "image" | "video" }

type Props = {
  items: Item[]
  className?: string
}

export function SwipeMediaCarousel({ items, className }: Props) {
  const [index, setIndex] = useState(0)
  const total = items.length
  const active = items[index]

  const prev = () => setIndex((i) => (i - 1 + total) % total)
  const next = () => setIndex((i) => (i + 1) % total)

  return (
    <div className={cn("relative", className)}>
      {active.type === "video" ? (
        <video src={active.url} className="h-full w-full object-cover" controls playsInline />
      ) : (
        <Image src={active.url} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 512px" />
      )}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous media"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white hover:bg-black/60"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next media"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white hover:bg-black/60"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/45 px-2 py-1">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to media ${i + 1}`}
                className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-white" : "bg-white/50")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
