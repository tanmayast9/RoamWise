import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Navbar from './components/Navbar'
import JourneyPlanner from './components/JourneyPlanner'
import MapView from './components/MapView'
import RouteCompare from './components/RouteCompare'
import DiscoveryPanel from './components/DiscoveryPanel'
import ItineraryPanel from './components/ItineraryPanel'
import TripSummary from './components/TripSummary'
import NavigationPanel from './components/NavigationPanel'
import AreaExplorer from './components/AreaExplorer'
import LoginPage from './components/LoginPage'
import landmarks from './data/landmarks.json'
import places from './data/places.json'
import { fetchWalkingRoute } from './lib/routing'
import { discoverAlongRoute } from './lib/discover'
import { PACE_KMH } from './lib/geo'
import { buildItinerary, summarizeCulture } from './lib/itinerary'
import { useLocalStorage } from './lib/useLocalStorage'
import './App.css'

function findLandmark(id) {
  return landmarks.find((item) => item.id === id)
}

export default function App() {
  const [startId, setStartId] = useState('cubbon')
  const [destId, setDestId] = useState('church-street')
  const [startTime, setStartTime] = useState('10:00')
  const [budgetMinutes, setBudgetMinutes] = useState(120)
  const [pace, setPace] = useState('steady')
  const [interests, setInterests] = useState(['food', 'heritage', 'park'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shortest, setShortest] = useState(null)
  const [explore, setExplore] = useState(null)
  const [nearby, setNearby] = useState([])
  const [pinnedIds, setPinnedIds] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectionVersion, setSelectionVersion] = useState(0)
  const [visibleRoute, setVisibleRoute] = useState('explore')
  const [itinerary, setItinerary] = useState(null)
  const [routeSource, setRouteSource] = useState('osrm')
  const [profile, setProfile] = useLocalStorage('roamwise-profile', null)
  const [reviews, setReviews] = useLocalStorage('roamwise-reviews', {})
  const [helpfulReviews, setHelpfulReviews] = useLocalStorage('roamwise-helpful-reviews', [])
  const [showProfile, setShowProfile] = useState(false)
  const didLoad = useRef(false)

  const start = findLandmark(startId)
  const dest = findLandmark(destId)

  const pinnedPlaces = useMemo(
    () =>
      pinnedIds
        .map((id) => nearby.find((p) => p.id === id) || places.find((p) => p.id === id))
        .filter(Boolean),
    [pinnedIds, nearby],
  )

  const rebuildExplore = useCallback(
    async (stops) => {
      const ordered = [...stops].sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0))
      const points = [start, ...ordered, dest]
      const exploreRoute = await fetchWalkingRoute(points, pace)
      const plan = buildItinerary({
        start,
        dest,
        startTime,
        stops: ordered,
        legs: exploreRoute.legs,
      })
      setExplore(exploreRoute)
      setItinerary(plan)
      setRouteSource(exploreRoute.source)
    },
    [start, dest, pace, startTime],
  )

  const planWalk = useCallback(async () => {
    if (!start || !dest) return
    if (startId === destId) {
      setError('Choose two different points so there is a walk to discover.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const shortestRoute = await fetchWalkingRoute([start, dest], pace)
      const walkMinutes = shortestRoute.duration / 60
      const found = discoverAlongRoute({
        places,
        start,
        dest,
        routeCoords: shortestRoute.coords,
        interests,
        startTime,
        budgetMinutes,
        walkMinutes,
        paceKmh: PACE_KMH[pace],
      })

      setShortest(shortestRoute)
      setNearby(found.nearby)
      const nextPins = found.suggested.map((p) => p.id)
      setPinnedIds(nextPins)
      setVisibleRoute('explore')
      setSelectedId(found.suggested[0]?.id || found.nearby[0]?.id || null)
      await rebuildExplore(found.suggested)
    } catch (err) {
      setError(err.message || 'Could not build that walk. Try another pair of places.')
    } finally {
      setLoading(false)
    }
  }, [start, dest, startId, destId, pace, interests, startTime, budgetMinutes, rebuildExplore])

  useEffect(() => {
    if (didLoad.current) return
    didLoad.current = true
    planWalk()
  }, [planWalk])

  async function handleTogglePin(id) {
    const exists = pinnedIds.includes(id)
    const nextIds = exists ? pinnedIds.filter((item) => item !== id) : [...pinnedIds, id]
    setPinnedIds(nextIds)
    if (!shortest) return
    const stops = nextIds
      .map((pin) => nearby.find((p) => p.id === pin) || places.find((p) => p.id === pin))
      .filter(Boolean)
    setLoading(true)
    try {
      await rebuildExplore(stops)
      setVisibleRoute('explore')
    } finally {
      setLoading(false)
    }
  }

  const mapPlaces = useMemo(() => {
    const byId = new Map()
    places.forEach((place) => byId.set(place.id, place))
    nearby.forEach((p) => byId.set(p.id, p))
    pinnedPlaces.forEach((p) => byId.set(p.id, p))
    return [...byId.values()]
  }, [nearby, pinnedPlaces])

  function handleAddReview(placeId, review) {
    setReviews((current) => ({
      ...current,
      [placeId]: [review, ...(current[placeId] || [])],
    }))
  }

  function handleVisitFeedback(place, feedback) {
    handleAddReview(place.id, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author: profile?.displayName || 'RoamWise walker',
      helpful: 0,
      createdAt: new Date().toISOString(),
      ...feedback,
    })
  }

  function handleHelpful(reviewId) {
    setHelpfulReviews((current) =>
      current.includes(reviewId)
        ? current.filter((id) => id !== reviewId)
        : [...current, reviewId],
    )
  }

  function handlePlannerChange(patch) {
    if (patch.startId) setStartId(patch.startId)
    if (patch.destId) setDestId(patch.destId)
    if (patch.startTime) setStartTime(patch.startTime)
    if (patch.budgetMinutes) setBudgetMinutes(patch.budgetMinutes)
    if (patch.pace) setPace(patch.pace)
  }

  function handleSelectPlace(id, scrollToMap = true) {
    setSelectedId(id)
    setSelectionVersion((version) => version + 1)
    if (scrollToMap) {
      document.getElementById('walk-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  if (showProfile) {
    return (
      <LoginPage
        profile={profile}
        onSave={(nextProfile) => {
          setProfile(nextProfile)
          setShowProfile(false)
        }}
        onSignOut={() => {
          setProfile(null)
          setShowProfile(false)
        }}
        onBack={() => setShowProfile(false)}
      />
    )
  }

  return (
    <div className="app">
      <Navbar profile={profile} onProfileClick={() => setShowProfile(true)} />
      <div className="layout">
        <aside className="planner-column">
          <JourneyPlanner
            landmarks={landmarks}
            startId={startId}
            destId={destId}
            startTime={startTime}
            budgetMinutes={budgetMinutes}
            pace={pace}
            interests={interests}
            loading={loading}
            error={error}
            onChange={handlePlannerChange}
            onToggleInterest={(id) => {
              setInterests((current) =>
                current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
              )
            }}
            onPlan={planWalk}
          />
          <ItineraryPanel
            itinerary={itinerary}
            cultureLine={summarizeCulture(startTime, pinnedPlaces)}
            source={routeSource}
          />
        </aside>

        <main className="map-column">
          <div className="map-wrap">
            <MapView
              id="walk-map"
              start={start}
              dest={dest}
              shortest={shortest?.coords}
              explore={explore?.coords}
              visibleRoute={visibleRoute}
              nearby={mapPlaces}
              selectedId={selectedId}
              selectionVersion={selectionVersion}
              onSelect={handleSelectPlace}
            />
            <RouteCompare
              shortest={shortest}
              explore={explore}
              extraStops={pinnedPlaces.length}
              visibleRoute={visibleRoute}
              onChangeRoute={setVisibleRoute}
            />
          </div>
          <div className="map-details">
            <NavigationPanel
              stops={pinnedPlaces}
              destination={dest}
              onFeedback={handleVisitFeedback}
            />
            <TripSummary places={pinnedPlaces} />
            <DiscoveryPanel
              nearby={nearby}
              pinnedIds={pinnedIds}
              selectedId={selectedId}
              onSelect={handleSelectPlace}
              onTogglePin={handleTogglePin}
              profile={profile}
              reviews={reviews}
              helpfulReviews={helpfulReviews}
              onAddReview={handleAddReview}
              onHelpful={handleHelpful}
              onSignIn={() => setShowProfile(true)}
            />
          </div>
          <AreaExplorer places={places} onSelectPlace={handleSelectPlace} />
        </main>
      </div>
    </div>
  )
}
