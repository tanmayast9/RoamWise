import { haversineMeters, minDistanceToPolyline, routeProgress, timeOfDayBucket } from './geo.js'

const CATEGORY_LABELS = {
  food: 'Food',
  heritage: 'Heritage',
  park: 'Parks',
  culture: 'Culture',
  architecture: 'Architecture',
  market: 'Markets',
}

export const INTERESTS = [
  { id: 'food', label: 'Regional food' },
  { id: 'heritage', label: 'Heritage' },
  { id: 'park', label: 'Parks & shade' },
  { id: 'culture', label: 'Culture' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'market', label: 'Markets' },
]

export const FOOD_FILTERS = [
  {
    id: 'vegetarian',
    label: 'Vegetarian options',
    available: (places) => places.some((place) => place.category === 'food' && 'vegetarian' in place),
    matches: (place) => place.vegetarian === true,
  },
  {
    id: 'karnataka',
    label: 'Karnataka specialties',
    available: (places) => places.some((place) => place.category === 'food' && 'karnatakaSpecialty' in place),
    matches: (place) => place.karnatakaSpecialty === true,
  },
  {
    id: 'budget',
    label: 'Budget-friendly',
    available: (places) => places.some((place) => place.category === 'food' && 'budgetFriendly' in place),
    matches: (place) => place.budgetFriendly === true,
  },
  {
    id: 'cafe',
    label: 'Cafés',
    available: (places) => places.some((place) => place.category === 'food' && 'foodType' in place),
    matches: (place) => place.foodType === 'cafe',
  },
  {
    id: 'quick',
    label: 'Quick stops',
    available: (places) => places.some((place) => place.category === 'food' && Number.isFinite(place.visitMinutes)),
    matches: (place) => place.visitMinutes <= 20,
  },
  {
    id: 'restaurant',
    label: 'Restaurants and eateries',
    available: (places) => places.some((place) => place.category === 'food' && 'foodType' in place),
    matches: (place) => place.foodType === 'restaurant',
  },
]

export function filterFoodPlaces(places, filterId) {
  if (!filterId) return places.filter((place) => place.category === 'food')
  const filter = FOOD_FILTERS.find((item) => item.id === filterId)
  if (!filter) return []
  return places.filter((place) => place.category === 'food' && filter.matches(place))
}

export function categoryLabel(id) {
  return CATEGORY_LABELS[id] || id
}

function scorePlace(place, interests, startTime) {
  const bucket = timeOfDayBucket(startTime)
  let score = 1
  if (!interests.length || interests.includes(place.category)) score += 5
  else score -= 1
  if (place.bestTime === 'any' || place.bestTime === bucket) score += 2
  if (place.category === 'food' && bucket === 'morning' && place.bestTime === 'morning') score += 1
  return score
}

function estimateDetourMinutes(place, routeCoords, paceKmh) {
  const along = minDistanceToPolyline(place, routeCoords)
  const extraMeters = along * 2
  return { extraMeters, minutes: (extraMeters / 1000 / paceKmh) * 60 }
}

export function discoverAlongRoute({
  places,
  start,
  dest,
  routeCoords,
  interests,
  startTime,
  budgetMinutes,
  walkMinutes,
  paceKmh = 4.5,
}) {
  const startKey = `${start.lat.toFixed(4)},${start.lng.toFixed(4)}`
  const destKey = `${dest.lat.toFixed(4)},${dest.lng.toFixed(4)}`

  const candidates = places
    .filter((place) => {
      const key = `${place.lat.toFixed(4)},${place.lng.toFixed(4)}`
      if (key === startKey || key === destKey) return false
      if (haversineMeters(place, start) < 80 || haversineMeters(place, dest) < 80) return false
      return true
    })
    .map((place) => {
      const distance = minDistanceToPolyline(place, routeCoords)
      const { progress } = routeProgress(place, routeCoords)
      return {
        ...place,
        distanceFromRoute: distance,
        progress,
        score: scorePlace(place, interests, startTime),
      }
    })

  let nearby = candidates
    .filter((p) => p.distanceFromRoute <= 650)
    .sort((a, b) => a.distanceFromRoute - b.distanceFromRoute)

  if (nearby.length < 4) {
    nearby = candidates
      .filter((p) => p.distanceFromRoute <= 1100)
      .sort((a, b) => a.distanceFromRoute - b.distanceFromRoute)
  }

  if (nearby.length < 3) {
    const mid = {
      lat: (start.lat + dest.lat) / 2,
      lng: (start.lng + dest.lng) / 2,
    }
    nearby = candidates
      .map((p) => ({ ...p, midDist: haversineMeters(p, mid) }))
      .sort((a, b) => a.midDist - b.midDist)
      .slice(0, 10)
  }

  const ranked = [...nearby].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.distanceFromRoute - b.distanceFromRoute
  })

  const availableForStops = Math.max(0, budgetMinutes - walkMinutes)
  let remaining = availableForStops
  const picked = []

  const feasible = ranked
    .map((place) => {
      const detour = estimateDetourMinutes(place, routeCoords, paceKmh)
      const duration = Number(place.visitMinutes) || 20
      const cost = duration + detour.minutes
      return {
        ...place,
        estimatedDetourMeters: detour.extraMeters,
        estimatedDetourMinutes: detour.minutes,
        estimatedTotalMinutes: cost,
        valuePerMinute: place.score / Math.max(1, cost),
      }
    })
    .sort((a, b) => b.valuePerMinute - a.valuePerMinute || a.distanceFromRoute - b.distanceFromRoute)

  for (const place of feasible) {
    if (picked.length >= 5) break
    if (place.estimatedTotalMinutes <= remaining) {
      const reasons = []
      if (!interests.length || interests.includes(place.category)) reasons.push('matches your interests')
      if (place.bestTime === 'any' || place.bestTime === timeOfDayBucket(startTime)) {
        reasons.push('fits your walk time')
      }
      if (place.distanceFromRoute < 180) reasons.push('close to the route')
      picked.push({
        ...place,
        recommendationReason: reasons.length ? reasons.join(' · ') : 'good experience for the time',
      })
      remaining -= place.estimatedTotalMinutes
    }
  }

  picked.sort((a, b) => a.progress - b.progress)
  const reasonById = new Map(picked.map((place) => [place.id, place.recommendationReason]))

  return {
    nearby: ranked.slice(0, 12).map((place) => ({
      ...place,
      recommendationReason: reasonById.get(place.id) || '',
    })),
    suggested: picked,
  }
}
