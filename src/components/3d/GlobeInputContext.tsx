"use client"

import { createContext, useContext, type MutableRefObject } from "react"
import type { PointerRef } from "./hooks/usePointerParallax"

export type GlobeInput = {
  pointer: MutableRefObject<PointerRef>
  scroll: MutableRefObject<number>
  /** 0–1 globe hover (updated once per frame by `GlobeHoverDriver`) */
  hover: MutableRefObject<number>
}

export const GlobeInputContext = createContext<GlobeInput | null>(null)

export function useGlobeInput() {
  const ctx = useContext(GlobeInputContext)
  if (!ctx) throw new Error("useGlobeInput must be used inside GlobeInputContext.Provider")
  return ctx
}
