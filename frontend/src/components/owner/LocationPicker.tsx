import type { MapMouseEvent } from "maplibre-gl"
import { useCallback, useEffect, useRef, useState } from "react"
import { Map, MapMarker, MarkerContent, MapControls, useMap } from "@/components/map/map"
import { MapPin } from "lucide-react"

export interface Location {
  latitude: number
  longitude: number
  address: string
}

interface LocationPickerProps {
  initialLocation?: Partial<Location>
  onLocationSelect: (location: Location) => void
}

const LEON_CENTER: [number, number] = [-5.567, 42.598]

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

interface NominatimReverseProps {
  latitude: number
  longitude: number
  onResult: (address: string) => void
}

function NominatimReverse({ latitude, longitude, onResult }: NominatimReverseProps) {
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  useEffect(() => {
    const controller = new AbortController()
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        onResultRef.current(data.display_name ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
      })
      .catch(() => {
        onResultRef.current(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
      })

    return () => controller.abort()
  }, [latitude, longitude])

  return null
}

export default function LocationPicker({ initialLocation, onLocationSelect }: LocationPickerProps) {
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(
    initialLocation?.latitude && initialLocation?.longitude
      ? { latitude: initialLocation.latitude, longitude: initialLocation.longitude }
      : null,
  )

  const [pendingAddress, setPendingAddress] = useState(false)
  const pendingCoords = useRef<{ latitude: number; longitude: number } | null>(null)

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setMarker({ latitude: lat, longitude: lng })
    pendingCoords.current = { latitude: lat, longitude: lng }
    setPendingAddress(true)
  }, [])

  const handleNominatimResult = useCallback(
    (address: string) => {
      if (pendingCoords.current) {
        onLocationSelect({
          latitude: pendingCoords.current.latitude,
          longitude: pendingCoords.current.longitude,
          address,
        })
        pendingCoords.current = null
      }
      setPendingAddress(false)
    },
    [onLocationSelect],
  )

  const handleMarkerDrag = useCallback(
    (lngLat: { lng: number; lat: number }) => {
      setMarker({ latitude: lngLat.lat, longitude: lngLat.lng })
      pendingCoords.current = { latitude: lngLat.lat, longitude: lngLat.lng }
      setPendingAddress(true)
    },
    [],
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
        {marker && pendingAddress && (
          <NominatimReverse
            key={`${marker.latitude}-${marker.longitude}`}
            latitude={marker.latitude}
            longitude={marker.longitude}
            onResult={handleNominatimResult}
          />
        )}
      </Map>
      <p className="text-muted-foreground mt-1.5 text-xs">
        Haz clic en el mapa para colocar un marcador o arrastra el marcador para ajustar la posición.
      </p>
    </div>
  )
}
