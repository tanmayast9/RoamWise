const R = 6371000

export function toRad(deg) {
  return (deg * Math.PI) / 180
}

export function haversineMeters(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, s)))
}

function toXY(point, originLat) {
  const kx = 111320 * Math.cos(toRad(originLat))
  const ky = 110540
  return { x: point.lng * kx, y: point.lat * ky }
}

export function pointToSegmentMeters(p, a, b) {
  const origin = p.lat
  const P = toXY(p, origin)
  const A = toXY(a, origin)
  const B = toXY(b, origin)
  const abx = B.x - A.x
  const aby = B.y - A.y
  const apx = P.x - A.x
  const apy = P.y - A.y
  const ab2 = abx * abx + aby * aby
  if (ab2 < 1) return Math.hypot(apx, apy)
  let t = (apx * abx + apy * aby) / ab2
  t = Math.max(0, Math.min(1, t))
  const cx = A.x + t * abx
  const cy = A.y + t * aby
  return Math.hypot(P.x - cx, P.y - cy)
}

export function minDistanceToPolyline(point, latLngs) {
  if (!latLngs?.length) return Infinity
  if (latLngs.length === 1) return haversineMeters(point, latLngs[0])
  let min = Infinity
  for (let i = 0; i < latLngs.length - 1; i += 1) {
    const d = pointToSegmentMeters(point, latLngs[i], latLngs[i + 1])
    if (d < min) min = d
  }
  return min
}

export function routeProgress(point, latLngs) {
  if (!latLngs?.length) return 0
  let best = 0
  let bestD = Infinity
  let walked = 0
  const lengths = []
  for (let i = 0; i < latLngs.length - 1; i += 1) {
    lengths.push(haversineMeters(latLngs[i], latLngs[i + 1]))
  }
  const total = lengths.reduce((s, n) => s + n, 0) || 1
  let acc = 0
  for (let i = 0; i < latLngs.length - 1; i += 1) {
    const a = latLngs[i]
    const b = latLngs[i + 1]
    const d = pointToSegmentMeters(point, a, b)
    if (d < bestD) {
      bestD = d
      const origin = point.lat
      const P = toXY(point, origin)
      const A = toXY(a, origin)
      const B = toXY(b, origin)
      const abx = B.x - A.x
      const aby = B.y - A.y
      const ab2 = abx * abx + aby * aby
      let t = 0
      if (ab2 > 1) {
        t = Math.max(0, Math.min(1, ((P.x - A.x) * abx + (P.y - A.y) * aby) / ab2))
      }
      best = (acc + t * lengths[i]) / total
    }
    acc += lengths[i]
    walked = acc
  }
  return { progress: best, totalMeters: walked || total }
}

export function boundsFromPoints(points) {
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}

export function formatKm(meters) {
  if (meters < 950) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function formatMinutes(mins) {
  const m = Math.max(0, Math.round(mins))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h} h ${rem} min` : `${h} h`
}

export function parseTimeToMinutes(hhmm) {
  const [h, m] = String(hhmm || '10:00')
    .split(':')
    .map((n) => Number(n) || 0)
  return h * 60 + m
}

export function minutesToTime(total) {
  const normalized = ((Math.round(total) % 1440) + 1440) % 1440
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  const suffix = h >= 12 ? 'pm' : 'am'
  const hr = ((h + 11) % 12) + 1
  return `${hr}:${String(m).padStart(2, '0')} ${suffix}`
}

export function timeOfDayBucket(hhmm) {
  const mins = parseTimeToMinutes(hhmm)
  if (mins < 12 * 60) return 'morning'
  if (mins < 17 * 60) return 'afternoon'
  return 'evening'
}

export const PACE_KMH = {
  leisurely: 3.8,
  steady: 4.5,
  brisk: 5.4,
}

export function walkMinutesForDistance(meters, pace) {
  const kmh = PACE_KMH[pace] || PACE_KMH.steady
  return (meters / 1000 / kmh) * 60
}
