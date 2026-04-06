"use client"

import { useCallback, useEffect, useState } from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { readStoredUserCoords, writeStoredUserCoords, clearStoredUserCoords } from "@/lib/geolocation-storage"

type Props = {
  variant?: "default" | "compact"
}

function notifyCoordsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("impactbridge:coords-updated"))
  }
}

export function LocationPromptBanner({ variant = "default" }: Props) {
  const [coords, setCoords] = useState<ReturnType<typeof readStoredUserCoords>>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "denied" | "error">("idle")

  useEffect(() => {
    setCoords(readStoredUserCoords())
  }, [])

  const enable = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error")
      return
    }
    setStatus("loading")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        writeStoredUserCoords(lat, lng)
        setCoords(readStoredUserCoords())
        setStatus("idle")
        notifyCoordsUpdated()
      },
      () => {
        setStatus("denied")
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 }
    )
  }, [])

  const clear = useCallback(() => {
    clearStoredUserCoords()
    setCoords(null)
    setStatus("idle")
    notifyCoordsUpdated()
  }, [])

  if (coords) {
    if (variant === "compact") {
      return (
        <p className="text-sm text-muted-foreground">
          Showing campaigns sorted by nearness when coordinates exist on the project.{" "}
          <button type="button" className="text-primary underline" onClick={clear}>
            Clear saved location
          </button>
        </p>
      )
    }
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>
            Location is on. We’ll prioritize campaigns with map pins closer to you (Explore and home).{" "}
            <span className="text-muted-foreground">
              Same flow works in mobile browsers and in-app WebViews (iOS/Android) over HTTPS.
            </span>
          </span>
        </p>
        <Button type="button" variant="outline" size="sm" className="shrink-0 self-start sm:self-center" onClick={clear}>
          Stop using location
        </Button>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
        <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span className="text-muted-foreground">Enable location to see campaigns closer to you.</span>
        <Button type="button" size="sm" variant="secondary" onClick={enable} disabled={status === "loading"}>
          {status === "loading" ? "Requesting…" : "Enable"}
        </Button>
        {(status === "denied" || status === "error") && (
          <span className="text-xs text-destructive">
            {status === "denied" ? "Permission denied. Check browser or OS settings." : "Location unavailable."}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="flex items-center gap-2 font-medium">
            <MapPin className="h-5 w-5 text-primary" aria-hidden />
            See campaigns closer to you
          </p>
          <p className="text-sm text-muted-foreground">
            Enable location once. We sort projects by distance when the NGO added map coordinates. Your position stays in
            this browser only (Web, Safari on iOS, Chrome, and Android WebView when permissions allow).
          </p>
          {(status === "denied" || status === "error") && (
            <p className="text-sm text-destructive">
              {status === "denied"
                ? "We couldn’t access location. Allow it in site settings, or keep browsing without nearness sorting."
                : "Geolocation isn’t available in this environment."}
            </p>
          )}
        </div>
        <Button
          type="button"
          className="shrink-0"
          onClick={enable}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Requesting…" : "Enable location"}
        </Button>
      </div>
    </div>
  )
}
