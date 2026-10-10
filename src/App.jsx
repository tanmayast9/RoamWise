import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Navbar from './components/Navbar'
import JourneyPlanner from './components/JourneyPlanner'
import MapView from './components/MapView'
import RouteCompare from './components/RouteCompare'
import DiscoveryPanel from './components/DiscoveryPanel'
import ItineraryPanel from './components/ItineraryPanel'
import NavigationPanel from './components/NavigationPanel'
import LoginPage from './components/LoginPage'
import {
  AboutPage,
  ExplorePage,
  ExperiencesPage,
  FeedbackPage,
  HomePage,
  NotFoundPage,
  PassportPage,
  PlaceDetailPage,
  SiteFooter,
  TripsPage,
} from './components/SitePages'
import landmarks from './data/landmarks.json'
import places from './data/places.json'
import { fetchWalkingRoute } from './lib/routing'
import { discoverAlongRoute } from './lib/discover'
import { PACE_KMH } from './lib/geo'
import { buildItinerary, summarizeCulture } from './lib/itinerary'
import { useLocalStorage } from './lib/useLocalStorage'
import { EXPERIENCE_PACKS } from './data/experiences'
import './App.css'

function findLandmark(id) {
  return landmarks.find((item) => item.id === id)
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname)
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
  const [recommendedIds, setRecommendedIds] = useState([])
  const [durationOverrides, setDurationOverrides] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [selectionVersion, setSelectionVersion] = useState(0)
  const [visibleRoute, setVisibleRoute] = useState('explore')
  const [itinerary, setItinerary] = useState(null)
  const [routeSource, setRouteSource] = useState('osrm')
  const [profile, setProfile] = useLocalStorage('roamwise-profile', null)
  const [reviews, setReviews] = useLocalStorage('roamwise-reviews', {})
  const [helpfulReviews, setHelpfulReviews] = useLocalStorage('roamwise-helpful-reviews', [])
  const [savedWalks, setSavedWalks] = useLocalStorage('roamwise-saved-walks', [])
  const [recentWalks, setRecentWalks] = useLocalStorage('roamwise-recent-walks', [])
  const [favoriteIds, setFavoriteIds] = useLocalStorage('roamwise-favorites', [])
  const [walkProgress, setWalkProgress] = useLocalStorage('roamwise-walk-progress', {
    walkKey: '',
    visitedIds: [],
    skippedIds: [],
    active: false,
  })
  const [completedWalks, setCompletedWalks] = useLocalStorage('roamwise-completed-walks', [])
  const [visitedPlaceIds, setVisitedPlaceIds] = useLocalStorage('roamwise-visited-places', [])
  const [feedbackItems, setFeedbackItems] = useLocalStorage('roamwise-feedback-drafts', [])
  const [replannedStart, setReplannedStart] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const didLoad = useRef(false)
  const skipInitialProgressSync = useRef(true)
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const placeRouteMatch = normalizedPath.match(/^\/places\/([^/]+)$/)
  const currentPlace = placeRouteMatch
    ? places.find((place) => place.id === placeRouteMatch[1])
    : null

  const navigate = useCallback((path) => {
    if (path === window.location.pathname) return
    window.history.pushState({}, '', path)
    setPathname(window.location.pathname)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    const titles = {
      '/': ['RoamWise — Explore Bengaluru, not just navigate it', 'Discover Bengaluru on foot. Plan a personal walking itinerary with local places, food, parks, and heritage along the way.'],
      '/explore': ['Explore Bengaluru on Foot | RoamWise', 'Search RoamWise’s curated Bengaluru place guide by area, category, and estimated visit time.'],
      '/plan': ['Plan Your Walk | RoamWise', 'Build and customize a Bengaluru walking itinerary with route estimates, curated stops, and a time budget.'],
      '/experiences': ['Walking Experiences | RoamWise', 'Preview curated Bengaluru walks and customize a route in the RoamWise planner.'],
      '/trips': ['My Trips | RoamWise', 'Access saved walks, favourite places, and completed walk summaries stored in this browser.'],
      '/passport': ['My RoamWise Passport | RoamWise', 'Review the walks and places you have marked visited in this browser.'],
      '/about': ['About RoamWise', 'Learn about RoamWise, a local-first walking companion for discovering Bengaluru.'],
      '/feedback': ['Feedback & Help | RoamWise', 'Save local feedback drafts and find quick guidance for using the RoamWise planner.'],
      '/help': ['Feedback & Help | RoamWise', 'Save local feedback drafts and find quick guidance for using the RoamWise planner.'],
    }
    const [title, description] = currentPlace
      ? [`${currentPlace.name} | RoamWise`, `${currentPlace.description} Explore ${currentPlace.name} in ${currentPlace.neighborhood} with RoamWise.`]
      : titles[normalizedPath] || ['Page Not Found | RoamWise', 'This RoamWise page could not be found. Return to the homepage or plan a walk.']
    document.title = title
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.append(meta)
    }
    meta.content = description
    const socialMetadata = [
      ['og:title', title],
      ['og:description', description],
      ['og:url', `${window.location.origin}${normalizedPath}`],
    ]
    socialMetadata.forEach(([property, content]) => {
      let socialMeta = document.querySelector(`meta[property="${property}"]`)
      if (!socialMeta) {
        socialMeta = document.createElement('meta')
        socialMeta.setAttribute('property', property)
        document.head.append(socialMeta)
      }
      socialMeta.content = content
    })
  }, [normalizedPath, currentPlace])

  const start = findLandmark(startId)
  const dest = findLandmark(destId)
  const safeWalkProgress = walkProgress && typeof walkProgress === 'object' && !Array.isArray(walkProgress)
    ? {
      ...walkProgress,
      visitedIds: Array.isArray(walkProgress.visitedIds) ? walkProgress.visitedIds : [],
      skippedIds: Array.isArray(walkProgress.skippedIds) ? walkProgress.skippedIds : [],
      active: Boolean(walkProgress.active),
    }
    : { walkKey: '', visitedIds: [], skippedIds: [], active: false }

  const pinnedPlaces = useMemo(
    () =>
      pinnedIds
        .map((id) => nearby.find((p) => p.id === id) || places.find((p) => p.id === id))
        .filter(Boolean),
    [pinnedIds, nearby],
  )

  const rebuildExplore = useCallback(
    async (stops, visitOverrides = durationOverrides) => {
      const ordered = stops.map((place) => ({
        ...place,
        visitMinutes: Number.isFinite(Number(visitOverrides[place.id]))
          ? Math.min(180, Math.max(5, Math.round(Number(visitOverrides[place.id]))))
          : place.visitMinutes,
      }))
      const points = [replannedStart || start, ...ordered, dest]
      const exploreRoute = await fetchWalkingRoute(points, pace)
      const plan = buildItinerary({
        start,
        dest,
        startTime,
        stops: ordered,
        legs: exploreRoute.legs,
        budgetMinutes,
      })
      setExplore(exploreRoute)
      setItinerary(plan)
      setRouteSource(exploreRoute.source)
    },
    [start, dest, pace, startTime, budgetMinutes, replannedStart, durationOverrides],
  )

  const planWalk = useCallback(async (savedWalk) => {
    didLoad.current = true
    const selectedStartId = savedWalk?.startId || startId
    const selectedDestId = savedWalk?.destId || destId
    const selectedStartTime = savedWalk?.startTime || startTime
    const selectedBudget = savedWalk?.budgetMinutes || budgetMinutes
    const selectedPace = savedWalk?.pace || pace
    const selectedInterests = Array.isArray(savedWalk?.interests) ? savedWalk.interests : interests
    const selectedStart = findLandmark(selectedStartId)
    const selectedDest = findLandmark(selectedDestId)
    if (!selectedStart || !selectedDest) {
      setError('This saved walk refers to a landmark that is no longer available.')
      return
    }
    if (selectedStartId === selectedDestId) {
      setError('Choose two different points so there is a walk to discover.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const shortestRoute = await fetchWalkingRoute([selectedStart, selectedDest], selectedPace)
      const walkMinutes = shortestRoute.duration / 60
      const found = discoverAlongRoute({
        places,
        start: selectedStart,
        dest: selectedDest,
        routeCoords: shortestRoute.discoveryCoords || shortestRoute.coords,
        interests: selectedInterests,
        startTime: selectedStartTime,
        budgetMinutes: selectedBudget,
        walkMinutes,
        paceKmh: PACE_KMH[selectedPace],
      })

      const savedStopIds = Array.isArray(savedWalk?.stopIds)
        ? [...new Set(savedWalk.stopIds.filter((id) => places.some((place) => place.id === id)))]
        : null
      const nextPins = savedStopIds || found.suggested.map((place) => place.id)
      const selectedStops = nextPins
        .map((id) => places.find((place) => place.id === id))
        .filter(Boolean)
        .map((place) => ({
          ...place,
          visitMinutes: Number(savedWalk?.durationOverrides?.[place.id]) || place.visitMinutes,
        }))
      const exploreRoute = await fetchWalkingRoute([selectedStart, ...selectedStops, selectedDest], selectedPace)
      const plan = buildItinerary({
        start: selectedStart,
        dest: selectedDest,
        startTime: selectedStartTime,
        stops: selectedStops,
        legs: exploreRoute.legs,
        budgetMinutes: selectedBudget,
      })
      if (savedWalk && plan.overBudgetMinutes > 0) {
        const accepted = window.confirm(
          `This saved walk is ${Math.ceil(plan.overBudgetMinutes)} minutes over the selected time budget. Load it anyway?`,
        )
        if (!accepted) return
      }

      setStartId(selectedStartId)
      setDestId(selectedDestId)
      setReplannedStart(null)
      setStartTime(selectedStartTime)
      setBudgetMinutes(selectedBudget)
      setPace(selectedPace)
      setInterests(selectedInterests)
      setDurationOverrides(
        savedWalk?.durationOverrides && typeof savedWalk.durationOverrides === 'object'
          ? savedWalk.durationOverrides
          : {},
      )
      setShortest(shortestRoute)
      setNearby(found.nearby)
      setPinnedIds(nextPins)
      setRecommendedIds(found.suggested.map((place) => place.id))
      setVisibleRoute('explore')
      setSelectedId(nextPins[0] || found.nearby[0]?.id || null)
      setExplore(exploreRoute)
      setItinerary(plan)
      setRouteSource(exploreRoute.source)
      const recentWalkKey = [selectedStartId, ...nextPins, selectedDestId].join('|')
      const recentWalk = {
        id: recentWalkKey,
        name: `${selectedStart.name} to ${selectedDest.name}`,
        startId: selectedStartId,
        destId: selectedDestId,
        startName: selectedStart.name,
        destName: selectedDest.name,
        startTime: selectedStartTime,
        budgetMinutes: selectedBudget,
        pace: selectedPace,
        interests: selectedInterests,
        stopIds: nextPins,
        durationOverrides: savedWalk?.durationOverrides || {},
        savedAt: new Date().toISOString(),
      }
      setRecentWalks((current) => [
        recentWalk,
        ...(Array.isArray(current) ? current.filter((walk) => walk?.id !== recentWalkKey) : []),
      ].slice(0, 6))
    } catch (err) {
      setError(err.message || 'Could not build that walk. Try another pair of places.')
    } finally {
      setLoading(false)
    }
  }, [startId, destId, pace, interests, startTime, budgetMinutes, setRecentWalks])

  useEffect(() => {
    if (didLoad.current || normalizedPath !== '/plan') return
    didLoad.current = true
    planWalk()
  }, [planWalk, normalizedPath])

  useEffect(() => {
    const walkKey = [startId, ...[...pinnedIds].sort(), destId].join('|')
    if (skipInitialProgressSync.current) {
      skipInitialProgressSync.current = false
      return
    }
    const activeIds = new Set([...pinnedIds, destId])
    setWalkProgress((current) => {
      if (
        current?.walkKey === walkKey &&
        Array.isArray(current.visitedIds) &&
        Array.isArray(current.skippedIds) &&
        typeof current.active === 'boolean'
      ) return current
      return {
        walkKey,
        visitedIds: (Array.isArray(current?.visitedIds) ? current.visitedIds : []).filter((id) => activeIds.has(id)),
        skippedIds: (Array.isArray(current?.skippedIds) ? current.skippedIds : []).filter((id) => activeIds.has(id)),
        active: Boolean(current?.active),
      }
    })
  }, [startId, destId, pinnedIds, setWalkProgress])

  async function handleReplanFromLocation(position) {
    if (!dest || !Number.isFinite(position?.lat) || !Number.isFinite(position?.lng)) {
      throw new Error('A valid current location is required to replan.')
    }
    const current = {
      id: 'current-location',
      name: 'Current location',
      neighborhood: 'Your location',
      lat: position.lat,
      lng: position.lng,
    }
    const visited = safeWalkProgress.visitedIds
    const skipped = safeWalkProgress.skippedIds
    const remainingStops = pinnedPlaces.filter(
      (place) => !visited.includes(place.id) && !skipped.includes(place.id),
    )
    const [direct, exploreRoute] = await Promise.all([
      fetchWalkingRoute([current, dest], pace),
      fetchWalkingRoute([current, ...remainingStops, dest], pace),
    ])
    const plan = buildItinerary({
      start: current,
      dest,
      startTime,
      stops: remainingStops,
      legs: exploreRoute.legs,
      budgetMinutes,
    })
    setReplannedStart(current)
    setShortest(direct)
    setExplore(exploreRoute)
    setItinerary(plan)
    setRouteSource(exploreRoute.source)
    setVisibleRoute('explore')
  }

  function handleMarkVisited(id) {
    const visitedIds = safeWalkProgress.visitedIds
    const skippedIds = safeWalkProgress.skippedIds
    const nextVisited = visitedIds.includes(id) ? visitedIds : [...visitedIds, id]
    setWalkProgress((current) => ({
      ...safeWalkProgress,
      visitedIds: nextVisited,
      skippedIds: (Array.isArray(current?.skippedIds) ? current.skippedIds : skippedIds).filter((skippedId) => skippedId !== id),
    }))
    setVisitedPlaceIds((current) => {
      const visited = Array.isArray(current) ? current : []
      return visited.includes(id) ? visited : [...visited, id]
    })
    const allOptionalStopsResolved = pinnedIds.every(
      (stopId) => nextVisited.includes(stopId) || skippedIds.includes(stopId),
    )
    if (nextVisited.includes(destId) && allOptionalStopsResolved) {
      const walkKey = safeWalkProgress.walkKey || [startId, ...pinnedIds, destId].join('|')
      const completed = {
        id: walkKey,
        title: `${start?.name || 'Start'} to ${dest?.name || 'Destination'}`,
        startName: start?.name || 'Start',
        destName: dest?.name || 'Destination',
        placeIds: pinnedIds.filter((placeId) => nextVisited.includes(placeId)).concat(destId),
        placeNames: pinnedPlaces
          .filter((place) => nextVisited.includes(place.id))
          .map((place) => place.name)
          .concat(dest?.name || []),
        categories: pinnedPlaces
          .filter((place) => nextVisited.includes(place.id))
          .map((place) => place.category),
        totalDistance: itinerary?.totalDistance || 0,
        totalMinutes: itinerary?.totalMinutes || 0,
        completedAt: new Date().toISOString(),
        journalNote: '',
      }
      setCompletedWalks((current) => {
        const walks = Array.isArray(current) ? current : []
        return walks.some((item) => item.id === walkKey) ? walks : [completed, ...walks]
      })
    }
  }

  function handleSkipStop(id) {
    setWalkProgress((current) => ({
      ...safeWalkProgress,
      skippedIds: (Array.isArray(current?.skippedIds) ? current.skippedIds : safeWalkProgress.skippedIds).includes(id)
        ? (Array.isArray(current?.skippedIds) ? current.skippedIds : safeWalkProgress.skippedIds)
        : [...(Array.isArray(current?.skippedIds) ? current.skippedIds : safeWalkProgress.skippedIds), id],
    }))
  }


  async function handleTogglePin(id) {
    const exists = pinnedIds.includes(id)
    const nextIds = exists ? pinnedIds.filter((item) => item !== id) : [...pinnedIds, id]
    if (!shortest) return
    await applyManualStops(nextIds)
  }

  async function applyManualStops(nextIds, overrides = durationOverrides) {
    const stops = nextIds
      .map((pin) => nearby.find((place) => place.id === pin) || places.find((place) => place.id === pin))
      .filter(Boolean)
      .map((place) => ({
        ...place,
        visitMinutes: Number(overrides[place.id]) || place.visitMinutes,
      }))
    setLoading(true)
    try {
      const route = await fetchWalkingRoute([replannedStart || start, ...stops, dest], pace)
      const plan = buildItinerary({
        start: replannedStart || start,
        dest,
        startTime,
        stops,
        legs: route.legs,
        budgetMinutes,
      })
      if (plan.overBudgetMinutes > 0) {
        const accepted = window.confirm(
          `This itinerary is ${Math.ceil(plan.overBudgetMinutes)} minutes over your ${budgetMinutes}-minute budget. Keep this change?`,
        )
        if (!accepted) return
      }
      setPinnedIds(nextIds)
      setExplore(route)
      setItinerary(plan)
      setRouteSource(route.source)
      setVisibleRoute('explore')
      setError('')
    } catch (err) {
      setError(err.message || 'Could not update the itinerary. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleFitBudget() {
    if (!shortest || !start || !dest) return
    const found = discoverAlongRoute({
      places,
      start,
      dest,
      routeCoords: shortest.discoveryCoords || shortest.coords,
      interests,
      startTime,
      budgetMinutes,
      walkMinutes: shortest.duration / 60,
      paceKmh: PACE_KMH[pace],
    })
    const nextIds = found.suggested.map((place) => place.id)
    setPinnedIds(nextIds)
    setRecommendedIds(nextIds)
    setLoading(true)
    try {
      await rebuildExplore(found.suggested)
      setVisibleRoute('explore')
      setError('')
    } catch (err) {
      setError(err.message || 'Could not fit the itinerary to your time budget.')
    } finally {
      setLoading(false)
    }
  }

  async function handleMoveStop(id, direction) {
    const index = pinnedIds.indexOf(id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= pinnedIds.length) return
    const nextIds = [...pinnedIds]
    ;[nextIds[index], nextIds[target]] = [nextIds[target], nextIds[index]]
    await applyManualStops(nextIds)
  }

  async function handleClearStops() {
    if (!window.confirm('Remove all optional stops from this itinerary?')) return
    setPinnedIds([])
    setLoading(true)
    try {
      await rebuildExplore([])
      setError('')
    } catch (err) {
      setError(err.message || 'Could not clear the optional stops.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetRecommendations() {
    const stops = recommendedIds
      .map((id) => nearby.find((place) => place.id === id) || places.find((place) => place.id === id))
      .filter(Boolean)
    setPinnedIds(recommendedIds)
    setDurationOverrides({})
    setLoading(true)
    try {
      await rebuildExplore(stops, {})
      setError('')
    } catch (err) {
      setError(err.message || 'Could not restore the recommended itinerary.')
    } finally {
      setLoading(false)
    }
  }

  function handleChangeStopDuration(id, minutes) {
    const nextOverrides = {
      ...durationOverrides,
      [id]: Math.min(180, Math.max(5, Math.round(Number(minutes) || 20))),
    }
    const stops = pinnedPlaces.map((place) => ({
      ...place,
      visitMinutes: Number(nextOverrides[place.id]) || place.visitMinutes,
    }))
    const nextItinerary = buildItinerary({
      start: replannedStart || start,
      dest,
      startTime,
      stops,
      legs: explore?.legs,
      budgetMinutes,
    })
    if (nextItinerary.overBudgetMinutes > 0) {
      const accepted = window.confirm(
        `This duration makes the itinerary ${Math.ceil(nextItinerary.overBudgetMinutes)} minutes over budget. Keep the change?`,
      )
      if (!accepted) return
    }
    setDurationOverrides(nextOverrides)
    setItinerary(nextItinerary)
  }

  const mapPlaces = useMemo(() => {
    const byId = new Map()
    places.forEach((place) => byId.set(place.id, place))
    nearby.forEach((p) => byId.set(p.id, p))
    pinnedPlaces.forEach((p) => byId.set(p.id, p))
    return [...byId.values()]
  }, [nearby, pinnedPlaces])

  function handleAddReview(placeId, review) {
    setReviews((current) => {
      const reviewMap = current && typeof current === 'object' && !Array.isArray(current) ? current : {}
      const existingReviews = Array.isArray(reviewMap[placeId]) ? reviewMap[placeId] : []
      return { ...reviewMap, [placeId]: [review, ...existingReviews] }
    })
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
    setHelpfulReviews((current) => {
      const votes = Array.isArray(current) ? current : []
      return votes.includes(reviewId) ? votes : [...votes, reviewId]
    })
  }

  function getCurrentWalk(id, name) {
    return {
      id,
      version: 1,
      name,
      startId,
      destId,
      startName: start?.name || 'Unknown start',
      destName: dest?.name || 'Unknown destination',
      startTime,
      budgetMinutes,
      pace,
      interests,
      stopIds: [...pinnedIds],
      durationOverrides,
      savedAt: new Date().toISOString(),
    }
  }

  function handleSaveWalk(name) {
    const walk = getCurrentWalk(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name)
    setSavedWalks((current) => [walk, ...(Array.isArray(current) ? current : [])])
  }

  function handleDuplicateSavedWalk(walk) {
    const duplicate = {
      ...walk,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `${walk.name} copy`.slice(0, 60),
      savedAt: new Date().toISOString(),
    }
    setSavedWalks((current) => [duplicate, ...(Array.isArray(current) ? current : [])])
  }

  function handleUpdateSavedWalk(id) {
    setSavedWalks((current) =>
      (Array.isArray(current) ? current : []).map((walk) =>
        walk.id === id ? getCurrentWalk(walk.id, walk.name) : walk,
      ),
    )
  }

  function handleLoadWalk(walk) {
    const knownInterests = new Set(['food', 'heritage', 'park', 'culture', 'architecture', 'market'])
    const knownStopIds = Array.isArray(walk?.stopIds) ? new Set(walk.stopIds) : new Set()
    if (
      !walk ||
      !findLandmark(walk.startId) ||
      !findLandmark(walk.destId) ||
      !Array.isArray(walk.stopIds) ||
      walk.stopIds.some((id) => !places.some((place) => place.id === id))
    ) {
      setError('This saved walk is incomplete or contains places that are no longer available.')
      return
    }
    planWalk({
      startId: walk.startId,
      destId: walk.destId,
      startTime: /^\d{2}:\d{2}$/.test(walk.startTime) ? walk.startTime : '10:00',
      budgetMinutes: Math.min(720, Math.max(30, Number(walk.duration || walk.budgetMinutes) || 120)),
      pace: PACE_KMH[walk.pace] ? walk.pace : 'steady',
      interests: Array.isArray(walk.interests)
        ? walk.interests.filter((interest) => knownInterests.has(interest))
        : [],
      stopIds: [...new Set(walk.stopIds)],
      durationOverrides: Object.fromEntries(
        Object.entries(walk.durationOverrides || {})
          .filter(([id, value]) => knownStopIds.has(id) && Number.isFinite(Number(value)))
          .map(([id, value]) => [id, Math.min(180, Math.max(5, Math.round(Number(value))))]),
      ),
    })
  }

  function handleDeleteWalk(id) {
    setSavedWalks((current) => (Array.isArray(current) ? current.filter((walk) => walk.id !== id) : []))
  }

  function handleSaveJournal(id, note) {
    setCompletedWalks((current) =>
      (Array.isArray(current) ? current : []).map((walk) =>
        walk.id === id ? { ...walk, journalNote: note.slice(0, 1000) } : walk,
      ),
    )
  }

  function handleToggleFavorite(id) {
    setFavoriteIds((current) => {
      const favorites = Array.isArray(current) ? current : []
      return favorites.includes(id)
        ? favorites.filter((favoriteId) => favoriteId !== id)
        : [...favorites, id]
    })
  }

  function handleAddPlaceToWalk(id) {
    const nextStopIds = [...new Set([...pinnedIds, id])]
    if (nextStopIds.length === pinnedIds.length) {
      navigate('/plan')
      return
    }
    planWalk({
      startId,
      destId,
      startTime,
      budgetMinutes,
      pace,
      interests,
      stopIds: nextStopIds,
    })
    navigate('/plan')
  }

  function handlePlannerChange(patch) {
    if (patch.startId) setStartId(patch.startId)
    if (patch.destId) setDestId(patch.destId)
    if (patch.startTime) setStartTime(patch.startTime)
    if (Number.isFinite(patch.budgetMinutes)) setBudgetMinutes(patch.budgetMinutes)
    if (patch.pace) setPace(patch.pace)
  }

  function handleSelectPlace(id, scrollToMap = true) {
    setSelectedId(id)
    setSelectionVersion((version) => version + 1)
    if (scrollToMap) {
      document.getElementById('walk-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const itineraryControls = {
    changeStopDuration: handleChangeStopDuration,
    clearStops: handleClearStops,
    resetRecommendations: handleResetRecommendations,
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

  const safeSavedWalks = Array.isArray(savedWalks)
    ? savedWalks.filter((walk) =>
      walk &&
      typeof walk.id === 'string' &&
      typeof walk.name === 'string' &&
      typeof walk.startName === 'string' &&
      typeof walk.destName === 'string' &&
      Array.isArray(walk.stopIds),
    )
    : []
  const safeRecentWalks = Array.isArray(recentWalks)
    ? recentWalks.filter((walk) =>
      walk &&
      typeof walk.id === 'string' &&
      typeof walk.startName === 'string' &&
      typeof walk.destName === 'string' &&
      Array.isArray(walk.stopIds),
    )
    : []
  const safeFavorites = Array.isArray(favoriteIds) ? favoriteIds : []
  const safeCompletedWalks = Array.isArray(completedWalks)
    ? completedWalks.filter((walk) =>
      walk &&
      typeof walk.id === 'string' &&
      typeof walk.title === 'string' &&
      Array.isArray(walk.placeIds) &&
      Array.isArray(walk.placeNames) &&
      Array.isArray(walk.categories),
    )
    : []
  const favoritePlaces = safeFavorites.map((id) => places.find((place) => place.id === id)).filter(Boolean)
  const visitedIdsForPassport = [...new Set([
    ...(Array.isArray(visitedPlaceIds) ? visitedPlaceIds : []),
    ...safeCompletedWalks.flatMap((walk) => Array.isArray(walk.placeIds) ? walk.placeIds : []),
  ])]
  const visitedPlaces = visitedIdsForPassport.map((id) => places.find((place) => place.id === id)).filter(Boolean)
  const experiencePacks = EXPERIENCE_PACKS
  const isPlannerPage = normalizedPath === '/plan'

  let page
  if (normalizedPath === '/') {
    page = <HomePage places={places} packs={experiencePacks} navigate={navigate} />
  } else if (normalizedPath === '/explore') {
    page = (
      <ExplorePage
        places={places}
        favoriteIds={safeFavorites}
        selectedId={selectedId}
        selectionVersion={selectionVersion}
        onSelect={(id) => handleSelectPlace(id, false)}
        onFavorite={handleToggleFavorite}
        onAdd={handleAddPlaceToWalk}
        navigate={navigate}
      />
    )
  } else if (normalizedPath === '/experiences') {
    page = (
      <ExperiencesPage
        packs={experiencePacks}
        places={places}
        landmarks={landmarks}
        onLoad={planWalk}
        navigate={navigate}
      />
    )
  } else if (normalizedPath === '/trips') {
    page = (
      <TripsPage
        savedWalks={safeSavedWalks}
        recentWalks={safeRecentWalks}
        favoritePlaces={favoritePlaces}
        completedWalks={safeCompletedWalks}
        activeWalk={safeWalkProgress.active ? {
          startName: start?.name || 'Start',
          destName: dest?.name || 'Destination',
          stopCount: pinnedIds.length,
          visitedCount: safeWalkProgress.visitedIds.length,
        } : null}
        onLoadWalk={handleLoadWalk}
        onDuplicate={handleDuplicateSavedWalk}
        onSaveWalk={handleSaveWalk}
        onUpdateWalk={handleUpdateSavedWalk}
        onDelete={handleDeleteWalk}
        navigate={navigate}
      />
    )
  } else if (normalizedPath === '/passport') {
    page = <PassportPage
      visitedPlaces={visitedPlaces}
      completedWalks={safeCompletedWalks}
      favoritePlaces={favoritePlaces}
      onSaveJournal={handleSaveJournal}
      navigate={navigate}
    />
  } else if (normalizedPath === '/about') {
    page = <AboutPage navigate={navigate} />
  } else if (normalizedPath === '/feedback' || normalizedPath === '/help') {
    page = <FeedbackPage feedbackItems={feedbackItems} setFeedbackItems={setFeedbackItems} navigate={navigate} />
  } else if (placeRouteMatch) {
    page = (
      <PlaceDetailPage
        place={currentPlace}
        places={places}
        favorite={Boolean(currentPlace && safeFavorites.includes(currentPlace.id))}
        onFavorite={handleToggleFavorite}
        onAdd={handleAddPlaceToWalk}
        reviews={reviews && typeof reviews === 'object' && !Array.isArray(reviews) ? reviews : {}}
        helpfulReviews={Array.isArray(helpfulReviews) ? helpfulReviews : []}
        profile={profile}
        onAddReview={handleAddReview}
        onHelpful={handleHelpful}
        onSignIn={() => setShowProfile(true)}
        navigate={navigate}
      />
    )
  } else {
    page = <NotFoundPage navigate={navigate} />
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
    <div className={`site-app ${isPlannerPage ? 'planner-site-app' : ''}`}>
      <Navbar
        profile={profile}
        pathname={normalizedPath}
        navigate={navigate}
        onProfileClick={() => setShowProfile(true)}
      />
      {isPlannerPage ? (
        <>
          <main className="planner-site-main">
            <div className={`planner-workspace layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <aside className={`planner-column ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
            <button
              className="sidebar-toggle"
              type="button"
              aria-expanded={!sidebarCollapsed}
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            >
              <span aria-hidden="true">{sidebarCollapsed ? '›' : '‹'}</span>
              <span className="sidebar-toggle-label">
                {sidebarCollapsed ? 'Show planner' : 'Collapse panel'}
              </span>
            </button>
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
              budgetMinutes={budgetMinutes}
              loading={loading}
              onFitBudget={handleFitBudget}
              onMoveStop={handleMoveStop}
              onChangeStopDuration={itineraryControls.changeStopDuration}
              onClearStops={itineraryControls.clearStops}
              onResetRecommendations={itineraryControls.resetRecommendations}
            />
            <DiscoveryPanel
              nearby={nearby}
              pinnedIds={pinnedIds}
              selectedId={selectedId}
              onSelect={handleSelectPlace}
              onTogglePin={handleTogglePin}
              profile={profile}
              favoriteIds={safeFavorites}
              onToggleFavorite={handleToggleFavorite}
              reviews={reviews && typeof reviews === 'object' && !Array.isArray(reviews) ? reviews : {}}
              helpfulReviews={Array.isArray(helpfulReviews) ? helpfulReviews : []}
              onAddReview={handleAddReview}
              onHelpful={handleHelpful}
              onSignIn={() => setShowProfile(true)}
            />
            </aside>

            <section className="map-column" aria-label="Interactive walking map">
              <div className="map-wrap">
                <MapView
                  id="walk-map"
                  start={replannedStart || start}
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
                <div className="map-details">
                  <NavigationPanel
                    stops={pinnedPlaces}
                    destination={dest}
                    itinerary={itinerary}
                    routeSource={routeSource}
                    places={pinnedPlaces}
                    visitedIds={safeWalkProgress.visitedIds}
                    skippedIds={safeWalkProgress.skippedIds}
                    walkActive={safeWalkProgress.active}
                    onSetWalkActive={(active) => setWalkProgress((current) => ({ ...safeWalkProgress, ...current, active }))}
                    onMarkVisited={handleMarkVisited}
                    onSkipStop={handleSkipStop}
                    onReplan={handleReplanFromLocation}
                    onFeedback={handleVisitFeedback}
                  />
                </div>
              </div>
            </section>
            </div>
          </main>
          <SiteFooter navigate={navigate} />
        </>
      ) : (
        <>
          {page}
          <SiteFooter navigate={navigate} />
        </>
      )}
    </div>
  )
}
