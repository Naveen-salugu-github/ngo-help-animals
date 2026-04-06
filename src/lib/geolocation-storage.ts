/** Browser localStorage, shared by web and in-app WebViews on iOS/Android (Capacitor/TWA). */

const KEY = "impactbridge:user_location_v1"

export type StoredUserCoords = {
  lat: number
  lng: number
  updatedAt: number
}

export function readStoredUserCoords(): StoredUserCoords | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as StoredUserCoords
    if (typeof v.lat !== "number" || typeof v.lng !== "number") return null
    return v
  } catch {
    return null
  }
}

export function writeStoredUserCoords(lat: number, lng: number): void {
  if (typeof window === "undefined") return
  const payload: StoredUserCoords = { lat, lng, updatedAt: Date.now() }
  localStorage.setItem(KEY, JSON.stringify(payload))
}

export function clearStoredUserCoords(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(KEY)
}
