import { HomeIcon, MapIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GeoJSONSource, MapMouseEvent } from 'maplibre-gl'
import { Map, MapMarker, MarkerContent, MapControls, useMap } from '@/components/map/map'
import { MapPin } from 'lucide-react'
import type { TenantProperty } from '@/types/tenant'
import styles from '@/styles/TenantMapFilter.module.css'

export interface MapFilterValues {
  lat: number
  lng: number
  radius: number
}

interface TenantMapFilterProps {
  onMapFilterChange?: (filters: MapFilterValues | null) => void
  properties?: TenantProperty[]
}

const LEON_CENTER: [number, number] = [-5.567, 42.598]
const DEFAULT_RADIUS = 1
const MIN_RADIUS = 0.5
const MAX_RADIUS = 10
const RADIUS_STEP = 0.1
const CIRCLE_POINTS = 64

function createCircleGeoJSON(
  center: [number, number],
  radiusKm: number,
  points = CIRCLE_POINTS,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng, lat] = center
  const coords: [number, number][] = []
  const kmPerDegLat = 111.32
  const kmPerDegLng = 111.32 * Math.cos((lat * Math.PI) / 180)

  for (let i = 0; i <= points; i++) {
    const bearing = (i / points) * 2 * Math.PI
    const dx = (radiusKm * Math.sin(bearing)) / kmPerDegLng
    const dy = (radiusKm * Math.cos(bearing)) / kmPerDegLat
    coords.push([lng + dx, lat + dy])
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  }
}

function MapCircleLayer({
  center,
  radiusKm,
}: {
  center: [number, number]
  radiusKm: number
}) {
  const { map, isLoaded } = useMap()
  const sourceId = 'map-filter-circle-source'
  const fillLayerId = 'map-filter-circle-fill'
  const outlineLayerId = 'map-filter-circle-outline'

  useEffect(() => {
    if (!isLoaded || !map) return

    const geoJson = createCircleGeoJSON(center, radiusKm)

    if (map.getSource(sourceId)) {
      ;(map.getSource(sourceId) as GeoJSONSource).setData(geoJson)
      return
    }

    map.addSource(sourceId, { type: 'geojson', data: geoJson })

    map.addLayer({
      id: fillLayerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': '#6436c7',
        'fill-opacity': 0.12,
      },
    })

    map.addLayer({
      id: outlineLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#6436c7',
        'line-width': 2,
        'line-opacity': 0.6,
        'line-dasharray': [4, 3],
      },
    })

    return () => {
      try {
        if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId)
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        /* ignore */
      }
    }
  }, [isLoaded, map, center, radiusKm])

  return null
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void
}) {
  const { map } = useMap()
  const ref = useRef(onMapClick)
  ref.current = onMapClick

  useEffect(() => {
    if (!map) return
    const handleClick = (e: MapMouseEvent) => {
      ref.current(e.lngLat.lat, e.lngLat.lng)
    }
    map.on('click', handleClick)
    return () => {
      map.off('click', handleClick)
    }
  }, [map])

  return null
}

export default function TenantMapFilter({
  onMapFilterChange = () => {},
  properties = [],
}: TenantMapFilterProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null)
  const [radius, setRadius] = useState(DEFAULT_RADIUS)

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setMarker({ latitude: lat, longitude: lng })
  }, [])

  const handleSearch = useCallback(() => {
    if (!marker) return
    onMapFilterChange({
      lat: marker.latitude,
      lng: marker.longitude,
      radius,
    })
  }, [marker, radius, onMapFilterChange])

  const handleToggle = useCallback(() => {
    const next = !isOpen
    setIsOpen(next)
    if (!next) {
      onMapFilterChange(null)
    }
  }, [isOpen, onMapFilterChange])

  const center: [number, number] = marker
    ? [marker.longitude, marker.latitude]
    : LEON_CENTER

  return (
    <div className={styles.panel}>
      <button
        type="button"
        onClick={handleToggle}
        className={styles.toggleButton}
        aria-expanded={isOpen}
      >
        <div className={styles.toggleLabel}>
          <MapIcon className={styles.icon} aria-hidden="true" />
          <span>{t('tenantDashboard.mapFilter.title')}</span>
        </div>
        <MapIcon className={styles.icon} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className={styles.mapContainer}>
          <Map
            className={styles.map}
            center={center}
            zoom={marker ? 14 : 13}
          >
            <MapControls showZoom />
            <MapClickHandler onMapClick={handleMapClick} />
            {marker && (
              <MapMarker
                longitude={marker.longitude}
                latitude={marker.latitude}
              >
                <MarkerContent>
                  <MapPin className="fill-primary stroke-white dark:fill-primary" size={28} />
                </MarkerContent>
              </MapMarker>
            )}
            {marker && (
              <MapCircleLayer center={[marker.longitude, marker.latitude]} radiusKm={radius} />
            )}
            {properties.map((p) =>
              p.latitude && p.longitude ? (
                <MapMarker key={p.id} longitude={p.longitude} latitude={p.latitude}>
                  <MarkerContent>
                    <div className={styles.propertyMarker}>
                      <HomeIcon className={styles.propertyMarkerIcon} />
                    </div>
                  </MarkerContent>
                </MapMarker>
              ) : null,
            )}
          </Map>

          <div className={styles.controls}>
            <div className={styles.sliderRow}>
              <label className={styles.sliderLabel}>
                {t('tenantDashboard.mapFilter.radius')}
              </label>
              <div className={styles.sliderValue}>
                {radius.toFixed(1)} km
              </div>
            </div>
            <input
              type="range"
              min={MIN_RADIUS}
              max={MAX_RADIUS}
              step={RADIUS_STEP}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className={styles.slider}
              aria-label={t('tenantDashboard.mapFilter.radius')}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={!marker}
              className={styles.searchButton}
            >
              {t('tenantDashboard.mapFilter.searchHere')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
