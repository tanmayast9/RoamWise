import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { categoryLabel } from '../lib/discover'
import { entryFee, googleMapsUrl } from '../lib/placeInfo'

const BENGALURU = [12.9716, 77.5946]

function pinIcon(className) {
  return L.divIcon({
    className: '',
    html: `<div class="${className}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function categoryIcon(category, selected) {
  const colors = {
    food: '#e07a3d',
    heritage: '#8b4b2a',
    park: '#2f7d4a',
    culture: '#6b4c9a',
    architecture: '#0f5c5b',
    market: '#c45f24',
  }
  const color = colors[category] || '#0f5c5b'
  const size = selected ? 32 : 26
  return L.divIcon({
    className: '',
    html: `<div class="marker" style="width:${size}px;height:${size}px;background:${color}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

function FitRoutes({ shortest, explore, start, dest }) {
  const map = useMap()

  useEffect(() => {
    const points = []
    if (start) points.push([start.lat, start.lng])
    if (dest) points.push([dest.lat, dest.lng])
    ;(explore || shortest || []).forEach((p) => points.push([p.lat, p.lng]))
    if (!points.length) {
      map.setView(BENGALURU, 13)
      return
    }
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds.pad(0.18))
    setTimeout(() => map.invalidateSize(), 80)
  }, [map, shortest, explore, start, dest])

  return null
}

export default function MapView({
  id,
  start,
  dest,
  shortest,
  explore,
  visibleRoute,
  nearby,
  selectedId,
  selectionVersion,
  onSelect,
}) {
  const markerRefs = useRef(new Map())
  const shortLatLngs = useMemo(
    () => (shortest || []).map((p) => [p.lat, p.lng]),
    [shortest],
  )
  const exploreLatLngs = useMemo(
    () => (explore || []).map((p) => [p.lat, p.lng]),
    [explore],
  )

  return (
    <div className="panel map-stage" id={id}>
      <MapContainer
        className="leaflet-map"
        center={BENGALURU}
        zoom={13}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitRoutes shortest={shortest} explore={explore} start={start} dest={dest} />
        <FocusSelectedPlace
          selectedId={selectedId}
          selectionVersion={selectionVersion}
          nearby={nearby}
          markerRefs={markerRefs}
        />

        {shortLatLngs.length > 1 ? (
          <Polyline
            positions={shortLatLngs}
            pathOptions={{
              color: '#e07a3d',
              weight: visibleRoute === 'shortest' ? 6 : 3,
              opacity: visibleRoute === 'shortest' ? 0.95 : 0.45,
              dashArray: visibleRoute === 'shortest' ? null : '8 8',
            }}
          />
        ) : null}

        {exploreLatLngs.length > 1 ? (
          <Polyline
            positions={exploreLatLngs}
            pathOptions={{
              color: '#0f5c5b',
              weight: visibleRoute === 'explore' ? 6 : 3,
              opacity: visibleRoute === 'explore' ? 0.95 : 0.4,
            }}
          />
        ) : null}

        {start ? (
          <Marker
            position={[start.lat, start.lng]}
            icon={pinIcon('start-pin')}
          >
            <Popup>
              <div className="popup">
                <h4>Start</h4>
                <p>{start.name}</p>
              </div>
            </Popup>
          </Marker>
        ) : null}

        {dest ? (
          <Marker position={[dest.lat, dest.lng]} icon={pinIcon('end-pin')}>
            <Popup>
              <div className="popup">
                <h4>Destination</h4>
                <p>{dest.name}</p>
              </div>
            </Popup>
          </Marker>
        ) : null}

        {nearby.map((place) => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={categoryIcon(place.category, place.id === selectedId)}
            ref={(marker) => {
              if (marker) markerRefs.current.set(place.id, marker)
              else markerRefs.current.delete(place.id)
            }}
            eventHandlers={{ click: () => onSelect(place.id, false) }}
          >
            <Popup>
              <div className="popup">
                <h4>{place.name}</h4>
                <p>
                  {categoryLabel(place.category)} · {place.neighborhood}
                </p>
                <p>{place.description}</p>
                <p><strong>Entry:</strong> {entryFee(place)}</p>
                <a href={googleMapsUrl(place)} target="_blank" rel="noreferrer">
                  Open in Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

function FocusSelectedPlace({ selectedId, selectionVersion, nearby, markerRefs }) {
  const map = useMap()

  useEffect(() => {
    const place = nearby.find((item) => item.id === selectedId)
    if (!place) return

    const marker = markerRefs.current.get(selectedId)
    map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 15), { duration: 0.45 })
    marker?.openPopup()
  }, [map, selectedId, selectionVersion, nearby, markerRefs])

  return null
}
