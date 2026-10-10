import { haversineMeters, walkMinutesForDistance } from './geo'

function toLatLng(coord) {
  return { lat: coord[1], lng: coord[0] }
}

function interpolateLine(start, end, steps = 24) {
  const coords = []
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    coords.push({
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
    })
  }
  return coords
}

function fallbackRoute(points, pace) {
  const coords = []
  let distance = 0
  const legs = []
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]
    const b = points[i + 1]
    const meters = haversineMeters(a, b) * 1.22
    const duration = walkMinutesForDistance(meters, pace) * 60
    distance += meters
    legs.push({ distance: meters, duration })
    const segment = interpolateLine(a, b)
    if (i > 0) segment.shift()
    coords.push(...segment)
  }
  return {
    coords,
    distance,
    duration: walkMinutesForDistance(distance, pace) * 60,
    legs,
    source: 'estimate',
  }
}

export async function fetchWalkingRoute(points, pace = 'steady') {
  if (!points || points.length < 2) {
    throw new Error('Need a start and a destination')
  }

  const path = points.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/foot/${path}?overview=full&geometries=geojson&steps=false`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('OSRM request failed')
    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('No walking route found')
    const route = data.routes[0]
    return {
      coords: route.geometry.coordinates.map(toLatLng),
      distance: route.distance,
      duration: route.duration,
      legs: route.legs.map((leg) => ({
        distance: leg.distance,
        duration: leg.duration,
      })),
      source: 'osrm',
    }
  } catch {
    return fallbackRoute(points, pace)
  }
}
