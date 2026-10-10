const TICKETED_PLACES = new Set([
  'visvesvaraya-museum',
  'bangalore-palace',
  'chitrakala',
  'lalbagh',
  'tipu-palace',
])

const EXTERIOR_ONLY_PLACES = new Set(['vidhana-soudha', 'attara-kacheri', 'bangalore-fort'])

export function isTicketedPlace(place) {
  return TICKETED_PLACES.has(place.id)
}

export function entryFee(place) {
  if (isTicketedPlace(place)) return 'Ticketed; confirm the current rate at the venue'
  if (EXTERIOR_ONLY_PLACES.has(place.id)) return 'Free to view from outside'
  return 'No venue-entry ticket noted; purchases may cost extra'
}

export function googleMapsUrl(place) {
  const query = `${place.name}, ${place.neighborhood}, Bengaluru`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function googleDirectionsUrl(points) {
  if (!points.length) return 'https://www.google.com/maps'
  const destination = points.at(-1)
  const params = new URLSearchParams({
    api: '1',
    origin: 'Current Location',
    destination: `${destination.name}, Bengaluru`,
    travelmode: 'walking',
  })
  const stops = points.slice(0, -1)
  if (stops.length) {
    params.set('waypoints', stops.map((place) => `${place.name}, Bengaluru`).join('|'))
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
