import { haversineKm } from "@/lib/distance"

export type ProjectWithCoords = {
  id: string
  latitude: number | null
  longitude: number | null
}

export function sortProjectsByDistance<T extends ProjectWithCoords>(
  projects: T[],
  userLat: number,
  userLng: number
): T[] {
  const withDist = projects.map((p) => {
    const lat = p.latitude
    const lng = p.longitude
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
      return { p, km: Number.POSITIVE_INFINITY }
    }
    return { p, km: haversineKm(userLat, userLng, lat, lng) }
  })
  withDist.sort((a, b) => a.km - b.km)
  return withDist.map((x) => x.p)
}
