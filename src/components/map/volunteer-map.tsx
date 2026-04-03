"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import L from "leaflet"
import { Button } from "@/components/ui/button"
import "leaflet/dist/leaflet.css"

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false })

export type MapProject = {
  id: string
  title: string
  location: string
  latitude: number | null
  longitude: number | null
  volunteer_category: string | null
  volunteer_slots: number
  volunteer_count: number
}

export function VolunteerMap({ projects }: { projects: MapProject[] }) {
  const withCoords = useMemo(
    () => projects.filter((p) => p.latitude != null && p.longitude != null),
    [projects]
  )
  const center = withCoords[0]
    ? [withCoords[0].latitude!, withCoords[0].longitude!] as [number, number]
    : ([17.6868, 83.2185] as [number, number])

  return (
    <div className="h-[min(70vh,560px)] w-full overflow-hidden rounded-xl border bg-muted">
      <MapContainer
        center={center}
        zoom={withCoords.length ? 6 : 5}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((p) => (
          <Marker key={p.id} position={[p.latitude!, p.longitude!]} icon={markerIcon}>
            <Popup>
              <div className="max-w-xs space-y-2 p-1">
                <p className="font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.location}</p>
                {p.volunteer_category && (
                  <p className="text-xs">{p.volunteer_category}</p>
                )}
                <p className="text-xs">
                  Volunteers: {p.volunteer_count}/{p.volunteer_slots}
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href={`/projects/${p.id}`}>View &amp; RSVP</Link>
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
