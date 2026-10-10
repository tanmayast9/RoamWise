import assert from 'node:assert/strict'
import test from 'node:test'
import { discoverAlongRoute, filterFoodPlaces, FOOD_FILTERS } from './discover.js'
import { buildItinerary } from './itinerary.js'
import { fetchWalkingRoute } from './routing.js'
import { getWalkWeather } from './weather.js'
import { EXPERIENCE_PACKS } from '../data/experiences.js'
import landmarks from '../data/landmarks.json' with { type: 'json' }
import places from '../data/places.json' with { type: 'json' }

test('budget optimizer selects only stops that fit after the direct walk', () => {
  const start = { id: 'start', name: 'Start', lat: 0, lng: 0 }
  const dest = { id: 'destination', name: 'Destination', lat: 0, lng: 0.01 }
  const candidates = [
    {
      id: 'short-stop',
      name: 'Short stop',
      category: 'food',
      lat: 0.0003,
      lng: 0.005,
      visitMinutes: 10,
      bestTime: 'any',
    },
    {
      id: 'long-stop',
      name: 'Long stop',
      category: 'food',
      lat: 0.0002,
      lng: 0.006,
      visitMinutes: 30,
      bestTime: 'any',
    },
  ]
  const result = discoverAlongRoute({
    places: candidates,
    start,
    dest,
    routeCoords: [start, dest],
    interests: ['food'],
    startTime: '10:00',
    budgetMinutes: 25,
    walkMinutes: 10,
    paceKmh: 4.5,
  })

  assert.deepEqual(result.suggested.map((place) => place.id), ['short-stop'])
  assert.match(result.suggested[0].recommendationReason, /matches your interests/)
  assert.ok(result.suggested[0].estimatedTotalMinutes <= 15)
})

test('itinerary summary includes walking, dwell, distance, and over-budget totals', () => {
  const start = { id: 'start', name: 'Start', neighborhood: 'Central' }
  const stop = {
    id: 'stop',
    name: 'Stop',
    neighborhood: 'Central',
    category: 'heritage',
    visitMinutes: 20,
  }
  const dest = { id: 'destination', name: 'Destination', neighborhood: 'Central' }
  const itinerary = buildItinerary({
    start,
    dest,
    startTime: '10:00',
    stops: [stop],
    legs: [
      { duration: 600, distance: 1000 },
      { duration: 600, distance: 1500 },
    ],
    budgetMinutes: 25,
  })

  assert.equal(itinerary.walkingMinutes, 20)
  assert.equal(itinerary.visitMinutes, 20)
  assert.equal(itinerary.totalDistance, 2500)
  assert.deepEqual(
    itinerary.items.filter((item) => item.type === 'walk').map((item) => item.distance),
    [1000, 1500],
  )
  assert.equal(itinerary.totalMinutes, 40)
  assert.equal(itinerary.overBudgetMinutes, 15)
})

test('food filters expose only attributes present in the curated records', () => {
  const foods = [
    { id: 'quick', category: 'food', visitMinutes: 15 },
    { id: 'slow', category: 'food', visitMinutes: 30 },
  ]
  const quickFilter = FOOD_FILTERS.find((filter) => filter.id === 'quick')
  const vegetarianFilter = FOOD_FILTERS.find((filter) => filter.id === 'vegetarian')

  assert.equal(quickFilter.available(foods), true)
  assert.deepEqual(filterFoodPlaces(foods, 'quick').map((place) => place.id), ['quick'])
  assert.equal(vegetarianFilter.available(foods), false)
})

test('every curated experience references available stops and landmarks', () => {
  const landmarkIds = new Set(landmarks.map((landmark) => landmark.id))
  const placeIds = new Set(places.map((place) => place.id))

  for (const pack of EXPERIENCE_PACKS) {
    assert.ok(landmarkIds.has(pack.startId), `${pack.title} has a valid start landmark`)
    assert.ok(landmarkIds.has(pack.destId), `${pack.title} has a valid destination landmark`)
    for (const stopId of pack.stopIds) {
      assert.ok(placeIds.has(stopId), `${pack.title} stop ${stopId} exists in the place guide`)
    }
  }
})

test('routing fallback exposes estimates without drawing invented route geometry', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    throw new Error('Offline')
  }
  try {
    const route = await fetchWalkingRoute([
      { lat: 12.97, lng: 77.59 },
      { lat: 12.98, lng: 77.6 },
    ])
    assert.equal(route.source, 'estimate')
    assert.deepEqual(route.coords, [])
    assert.equal(route.discoveryCoords.length, 2)
    assert.match(route.notice, /no walking route geometry/i)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('weather integration reports an explicit unavailable state without a provider', async () => {
  const weather = await getWalkWeather(null, { lat: 12.97, lng: 77.59 })
  assert.equal(weather.status, 'unavailable')
  assert.match(weather.message, /no weather provider is configured/i)
})

test('weather integration validates and normalizes provider results', async () => {
  const weather = await getWalkWeather(
    async () => ({
      observedAt: '2026-10-10T09:00:00Z',
      summary: 'Cloudy',
      precipitationProbability: 120,
    }),
    { lat: 12.97, lng: 77.59 },
  )
  assert.equal(weather.status, 'available')
  assert.equal(weather.precipitationProbability, 100)
  await assert.rejects(
    getWalkWeather(async () => ({ summary: 'Cloudy' }), {}),
    /valid observedAt timestamp/,
  )
})

test('routed walking time uses the selected walking pace', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      code: 'Ok',
      routes: [{
        geometry: { coordinates: [[77.59, 12.97], [77.6, 12.98]] },
        distance: 4500,
        duration: 5400,
        legs: [{ distance: 4500, duration: 5400 }],
      }],
    }),
  })
  try {
    const leisurely = await fetchWalkingRoute([
      { lat: 12.97, lng: 77.59 },
      { lat: 12.98, lng: 77.6 },
    ], 'leisurely')
    const brisk = await fetchWalkingRoute([
      { lat: 12.97, lng: 77.59 },
      { lat: 12.98, lng: 77.6 },
    ], 'brisk')
    assert.equal(leisurely.source, 'osrm')
    assert.ok(leisurely.duration > brisk.duration)
    assert.equal(leisurely.legs[0].duration, leisurely.duration)
  } finally {
    globalThis.fetch = originalFetch
  }
})
