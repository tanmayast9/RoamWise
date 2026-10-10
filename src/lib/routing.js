import { haversineMeters, walkMinutesForDistance } from './geo.js'

function toLatLng(coord) {
  return { lat: coord[1], lng: coord[0] }
}

function fallbackRoute(points, pace) {
  let estimatedDistance = 0
  const legs = []
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]
    const b = points[i + 1]
    const straightLineMeters = haversineMeters(a, b)
    const estimatedMeters = straightLineMeters * 1.22
    const duration = walkMinutesForDistance(estimatedMeters, pace) * 60
    estimatedDistance += estimatedMeters
    legs.push({ distance: estimatedMeters, duration })
  }
  return {
    coords: [],
    discoveryCoords: points,
    distance: estimatedDistance,
    duration: walkMinutesForDistance(estimatedDistance, pace) * 60,
    legs,
    source: 'estimate',
    notice: 'Routing is unavailable. Distance and time are rough estimates; no walking route geometry is shown.',
  }
}

export async function fetchWalkingRoute(points, pace = 'steady') {
  if (!points || points.length < 2) {
    throw new Error('Need a start and a destination')
  }

  const path = points.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/foot/${path}?overview=full&geometries=geojson&steps=false`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error('OSRM request failed')
    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('No walking route found')
    const route = data.routes[0]
    const legs = route.legs.map((leg) => ({
    distance: leg.distance,
    duration: walkMinutesForDistance(leg.distance, pace) * 60,
    }))
    const duration = walkMinutesForDistance(route.distance, pace) * 60
    return {
    coords: route.geometry.coordinates.map(toLatLng),
    distance: route.distance,
    duration,
    legs,
    source: 'osrm',
    notice: 'Walking time is estimated from the routed distance and your selected pace.',
    }
  } catch {
    return fallbackRoute(points, pace)
  }
}
