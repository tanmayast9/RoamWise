import { useEffect, useMemo, useState } from 'react'
import { formatKm, haversineMeters } from '../lib/geo'
import { googleDirectionsUrl, isTicketedPlace } from '../lib/placeInfo'

export default function NavigationPanel({
  stops,
  destination,
  itinerary,
  routeSource,
  places,
  visitedIds,
  skippedIds,
  walkActive,
  onSetWalkActive,
  onMarkVisited,
  onSkipStop,
  onReplan,
  onFeedback,
}) {
  const [tracking, setTracking] = useState(false)
  const [position, setPosition] = useState(null)
  const [distance, setDistance] = useState(null)
  const [pendingFeedback, setPendingFeedback] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [visitTag, setVisitTag] = useState('worth-visiting')
  const [durationAccurate, setDurationAccurate] = useState('')
  const [locationError, setLocationError] = useState('')

  const targets = useMemo(
    () => [
      ...stops.filter((place) => !skippedIds.includes(place.id) && !visitedIds.includes(place.id)),
      destination,
    ].filter(Boolean),
    [stops, destination, skippedIds, visitedIds],
  )
  const nextTarget = targets.find((place) => !visitedIds.includes(place.id))
  const plannedVisitCount = stops.length
  const resolvedVisitCount = stops.filter(
    (place) => visitedIds.includes(place.id) || skippedIds.includes(place.id),
  ).length
  const feedbackTarget = pendingFeedback[0]
  const directionsUrl = googleDirectionsUrl(targets)
  const foodCount = places.filter((place) => place.category === 'food').length
  const ticketedCount = places.filter(isTicketedPlace).length
  const itineraryStops = (itinerary?.items || []).filter((item) => item.type === 'stop')
  const remainingStops = itineraryStops.filter(
    (item) => !visitedIds.includes(item.place.id) && !skippedIds.includes(item.place.id),
  )
  const nextItineraryStopIndex = itineraryStops.findIndex(
    (item) => !visitedIds.includes(item.place.id) && !skippedIds.includes(item.place.id),
  )
  const walkingSegments = (itinerary?.items || []).filter((item) => item.type === 'walk')
  const remainingSegments = walkingSegments.slice(
    nextItineraryStopIndex < 0 ? itineraryStops.length : nextItineraryStopIndex,
  )
  const remainingMinutes =
    remainingSegments.reduce((total, item) => total + (Number(item.minutes) || 0), 0) +
    remainingStops.reduce((total, item) => total + (Number(item.place.visitMinutes) || 0), 0)
  const remainingDistance = remainingSegments.reduce(
    (total, item) => total + (Number(item.distance) || 0),
    0,
  )

  useEffect(() => {
    if (!tracking) return undefined
    if (!navigator.geolocation) return undefined

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const current = { lat: coords.latitude, lng: coords.longitude }
        setPosition(current)
        setLocationError('')
        if (!nextTarget || visitedIds.includes(nextTarget.id)) return
        const metersAway = haversineMeters(current, nextTarget)
        setDistance(metersAway)
        if (metersAway <= 65) {
          onMarkVisited(nextTarget.id)
          setPendingFeedback((currentFeedback) =>
            currentFeedback.some((place) => place.id === nextTarget.id)
              ? currentFeedback
              : [...currentFeedback, nextTarget],
          )
        }
      },
      (error) => {
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. You can still use Google Maps or mark a stop visited yourself.'
            : 'Could not get your location. Try again or mark a stop visited yourself.',
        )
        setTracking(false)
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [tracking, nextTarget, visitedIds, onMarkVisited])

  function markVisited(place) {
    onMarkVisited(place.id)
    setPendingFeedback((currentFeedback) =>
      currentFeedback.some((item) => item.id === place.id)
        ? currentFeedback
        : [...currentFeedback, place],
    )
  }

  function startTracking() {
    onSetWalkActive(true)
    if (!navigator.geolocation) {
      setLocationError('Location tracking is not available in this browser.')
      return
    }
    setLocationError('')
    setTracking(true)
  }

  async function replan() {
    try {
      await onReplan(position)
      setLocationError('')
    } catch (error) {
      setLocationError(error.message || 'Could not replan from your current location.')
    }
  }

  function skipNextStop() {
    if (!nextTarget || nextTarget.id === destination?.id) return
    onSkipStop(nextTarget.id)
  }

  function submitFeedback(event) {
    event.preventDefault()
    onFeedback(feedbackTarget, {
      rating,
      comment: comment.trim() || 'Visited this place.',
      visitTag,
      durationAccurate: durationAccurate === '' ? null : durationAccurate === 'yes',
      source: 'visit',
    })
    setPendingFeedback((current) => current.slice(1))
    setRating(5)
    setComment('')
    setVisitTag('worth-visiting')
    setDurationAccurate('')
  }

  return (
    <section className="navigation-panel">
      <div className="navigation-heading">
        <div className="kicker">On your walk</div>
        <h3>Walking navigation</h3>
      </div>
      <div className="navigation-actions">
        <a
          className="plan-btn navigation-link"
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            onSetWalkActive(true)
            startTracking()
          }}
        >
          Start directions <span aria-hidden="true">↗</span>
        </a>
        <button
          className="navigation-track"
          type="button"
          title="Location is only used while tracking is on"
          onClick={() => {
            if (tracking) setTracking(false)
            else startTracking()
          }}
        >
          {tracking ? 'Pause tracking' : 'Track progress'}
        </button>
        <button
          className="navigation-walk"
          type="button"
          onClick={() => {
            if (walkActive) {
              onSetWalkActive(false)
              setTracking(false)
            } else {
              onSetWalkActive(true)
            }
          }}
        >
          {walkActive ? 'End walk' : 'Start walk'}
        </button>
      </div>
      <div className="navigation-metrics" aria-label="Itinerary summary">
        <span><strong>{places.length}</strong> {places.length === 1 ? 'Stop' : 'Stops'}</span>
        <span><strong>{foodCount}</strong> {foodCount === 1 ? 'Food' : 'Food stops'}</span>
        <span title={ticketedCount
          ? 'Some selected venues may require tickets; check current prices with the venue.'
          : 'No ticket price is listed for the selected stops; confirm with venues before visiting.'}>
          {ticketedCount ? 'Check venue' : 'No price listed'}
        </span>
      </div>
      {walkActive || tracking || locationError ? (
        <div className="navigation-progress">
          <span className="navigation-progress-count">
            {visitedIds.filter((id) => stops.some((place) => place.id === id)).length}/{plannedVisitCount} stops visited
          </span>
          <progress
            className="walk-progress-bar"
            max={Math.max(plannedVisitCount, 1)}
            value={resolvedVisitCount}
            aria-label={`${resolvedVisitCount} of ${plannedVisitCount} planned stops visited or skipped`}
          />
          {itinerary ? (
            <p className="navigation-status">
              Remaining planned estimate: {remainingMinutes} min · {formatKm(remainingDistance)}
              {routeSource === 'estimate' ? ' · approximate route' : ''}
            </p>
          ) : null}
          {locationError ? <p className="error" role="status">{locationError}</p> : null}
          {tracking ? (
            <p className="navigation-status" role="status">
              {position
                ? nextTarget
                  ? `Next: ${nextTarget.name}${distance === null ? '' : ` · ${formatKm(distance)} away`}`
                  : 'All planned stops visited.'
                : 'Waiting for location…'}
            </p>
          ) : null}
          {nextTarget ? (
            <button className="text-button" type="button" onClick={() => markVisited(nextTarget)}>
              Mark {nextTarget.name} visited
            </button>
          ) : null}
          {nextTarget && nextTarget.id !== destination?.id ? (
            <button className="text-button" type="button" onClick={skipNextStop}>Skip this stop</button>
          ) : null}
          {tracking && position && nextTarget ? (
            <button className="text-button" type="button" onClick={replan}>Replan from my location</button>
          ) : null}
        </div>
      ) : null}
      {feedbackTarget ? (
        <form className="visit-feedback" onSubmit={submitFeedback}>
          <strong>How was {feedbackTarget.name}?</strong>
          <label htmlFor="visit-rating">Your rating</label>
          <select
            id="visit-rating"
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
          >
            {[5, 4, 3, 2, 1].map((score) => (
              <option key={score} value={score}>{score} {score === 1 ? 'star' : 'stars'}</option>
            ))}
          </select>
          <label htmlFor="visit-tag">Visit feedback</label>
          <select id="visit-tag" value={visitTag} onChange={(event) => setVisitTag(event.target.value)}>
            <option value="worth-visiting">Worth visiting</option>
            <option value="good-for-families">Good for families</option>
            <option value="needs-more-info">Needs more information</option>
          </select>
          <label htmlFor="duration-accuracy">Was the estimated visit time accurate?</label>
          <select
            id="duration-accuracy"
            value={durationAccurate}
            onChange={(event) => setDurationAccurate(event.target.value)}
          >
            <option value="">Skip</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <label htmlFor="visit-comment">Feedback for other walkers</label>
          <textarea
            id="visit-comment"
            maxLength={500}
            placeholder="Anything useful to know?"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <button className="review-submit" type="submit">Save feedback</button>
        </form>
      ) : null}
      <p className="sr-only">
        Directions open in Google Maps. Location is watched only while tracking is on; progress and feedback stay in this browser.
      </p>
    </section>
  )
}
