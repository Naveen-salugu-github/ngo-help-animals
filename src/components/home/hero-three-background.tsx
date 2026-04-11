"use client"

import dynamic from "next/dynamic"
import { HeroGlobeFallback } from "@/components/home/hero-globe-r3f"

const HeroGlobeR3f = dynamic(() => import("@/components/home/hero-globe-r3f").then((m) => m.HeroGlobeR3f), {
  ssr: false,
  loading: () => <HeroGlobeFallback />,
})

/**
 * Full-viewport immersive background: modular R3F globe (desktop) or animated fallback (low power / small screens).
 */
export function HeroThreeBackground() {
  return <HeroGlobeR3f />
}
