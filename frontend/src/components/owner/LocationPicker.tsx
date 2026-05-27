import type { MapMouseEvent } from "maplibre-gl"
import { useCallback, useEffect, useRef, useState } from "react"
import { Map, MapMarker, MarkerContent, MapControls, useMap } from "@/components/map/map"
import { MapPin } from "lucide-react"

export interface Location {
  latitude: number
  longitude: number
  address: string
  zone: string
}

interface LocationPickerProps {
  initialLocation?: Partial<Location>
  onLocationSelect: (location: Location) => void
}

const LEON_CENTER: [number, number] = [-5.567, 42.598]
const DEBOUNCE_MS = 300

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  const { map } = useMap()
  const ref = useRef(onMapClick)
  ref.current = onMapClick

  useEffect(() => {
    if (!map) return
    const handleClick = (e: MapMouseEvent) => {
      ref.current(e.lngLat.lat, e.lngLat.lng)
    }
    map.on("click", handleClick)
    return () => { map.off("click", handleClick) }
  }, [map])

  return null
}

export default function LocationPicker({ initialLocation, onLocationSelect }: LocationPickerProps) {
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(
    initialLocation?.latitude && initialLocation?.longitude
      ? { latitude: initialLocation.latitude, longitude: initialLocation.longitude }
      : null,
  )

  const pendingCoords = useRef<{ latitude: number; longitude: number } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchAddress = useCallback((lat: number, lng: number) => {
    fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.address) {
          onLocationSelect({ latitude: lat, longitude: lng, address: data.address, zone: data.zone || "" })
          pendingCoords.current = null
        }
      })
      .catch(() => {
        onLocationSelect({ latitude: lat, longitude: lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, zone: "" })
        pendingCoords.current = null
      })
  }, [onLocationSelect])

  const scheduleAddressFetch = useCallback((lat: number, lng: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    pendingCoords.current = { latitude: lat, longitude: lng }
    debounceRef.current = setTimeout(() => {
      fetchAddress(lat, lng)
    }, DEBOUNCE_MS)
  }, [fetchAddress])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setMarker({ latitude: lat, longitude: lng })
    scheduleAddressFetch(lat, lng)
  }, [scheduleAddressFetch])

  const handleMarkerDrag = useCallback(
    (lngLat: { lng: number; lat: number }) => {
      setMarker({ latitude: lngLat.lat, longitude: lngLat.lng })
      scheduleAddressFetch(lngLat.lat, lngLat.lng)
    },
    [scheduleAddressFetch],
  )

  const center: [number, number] = marker
    ? [marker.longitude, marker.latitude]
    : LEON_CENTER

  return (
    <div>
      <Map className="h-[300px] w-full rounded-lg border" center={center} zoom={marker ? 16 : 13}>
        <MapControls showZoom />
        <MapClickHandler onMapClick={handleMapClick} />
        {marker && (
          <MapMarker
            draggable
            longitude={marker.longitude}
            latitude={marker.latitude}
            onDragEnd={handleMarkerDrag}
          >
            <MarkerContent>
              <div className="cursor-move">
                <MapPin className="fill-primary stroke-white dark:fill-primary" size={28} />
              </div>
            </MarkerContent>
          </MapMarker>
        )}
      </Map>
      <p className="text-muted-foreground mt-1.5 text-xs">
        Haz clic en el mapa para colocar un marcador o arrastra el marcador para ajustar la posición.
      </p>
    </div>
  )
}
