"use client"

import { useEffect } from "react"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    void navigator.serviceWorker.register("/sw-assets.js").catch((err) => {
      console.error("[SW] register failed:", err)
    })
  }, [])

  return null
}
