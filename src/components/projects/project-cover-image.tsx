"use client"

import { useState } from "react"

const FALLBACK =
  "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&q=80"

type Props = {
  src: string | null | undefined
  alt: string
  className?: string
}

/**
 * NGO cover URLs are often hotlinked (e.g. Google Photos) and break with next/image domain allowlists.
 * Match project detail page: plain img + no-referrer.
 */
export function ProjectCoverImage({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false)
  const url = !src || failed ? FALLBACK : src

  return (
    // eslint-disable-next-line @next/next/no-img-element -- intentional for arbitrary NGO URLs
    <img
      src={url}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      loading="lazy"
      decoding="async"
    />
  )
}
