import { useEffect, useMemo, useState } from 'react'
import { formatKm, haversineMeters } from '../lib/geo'
import { googleDirectionsUrl } from '../lib/placeInfo'

export default function NavigationPanel({ stops, destination, onFeedback }) {
  const [tracking, setTracking] = useState(false)
  const [position, setPosition] = useState(null)
  const [distance, setDistance] = useState(null)
  const [visitedIds, setVisitedIds] = useState([])
  const [pendingFeedback, setPendingFeedback] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [locationError, setLocationError] = useState('')

  const targets = useMemo(
    () => [...stops, destination].filter(Boolean),
    [stops, destination],
  )
  const nextTarget = targets.find((place) => !visitedIds.includes(place.id))
  const feedbackTarget = pendingFeedback[0]
  const directionsUrl = googleDirectionsUrl(targets)

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
          setVisitedIds((currentIds) =>
            currentIds.includes(nextTarget.id) ? currentIds : [...currentIds, nextTarget.id],
          )
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
  }, [tracking, nextTarget, visitedIds])

  function markVisited(place) {
    setVisitedIds((currentIds) =>
      currentIds.includes(place.id) ? currentIds : [...currentIds, place.id],
    )
    setPendingFeedback((currentFeedback) =>
      currentFeedback.some((item) => item.id === place.id)
        ? currentFeedback
        : [...currentFeedback, place],
    )
  }

  function startTracking() {
    if (!navigator.geolocation) {
      setLocationError('Location tracking is not available in this browser.')
      return
    }
    setLocationError('')
    setTracking(true)
  }

  function submitFeedback(event) {
    event.preventDefault()
    onFeedback(feedbackTarget, {
      rating,
      comment: comment.trim() || 'Visited this place.',
      source: 'visit',
    })
    setPendingFeedback((current) => current.slice(1))
    setRating(5)
    setComment('')
  }

  return (
    <section className="navigation-panel">
      <div className="kicker">On your walk</div>
      <h3>Walking navigation</h3>
      <p className="navigation-copy">
        Open turn-by-turn walking directions in Google Maps. Allow location access here to track
        progress and get a feedback prompt when you reach a stop.
      </p>
      <div className="navigation-actions">
        <a
          className="plan-btn navigation-link"
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            startTracking()
          }}
        >
          Start walking directions ↗
        </a>
        <button
          className="navigation-track"
          type="button"
          onClick={() => {
            if (tracking) setTracking(false)
            else startTracking()
          }}
        >
          {tracking ? 'Pause location tracking' : 'Track my progress'}
        </button>
      </div>
      {locationError ? <p className="error" role="status">{locationError}</p> : null}
      {tracking ? (
        <p className="navigation-status" role="status">
          {position
            ? nextTarget
              ? `Next: ${nextTarget.name}${distance === null ? '' : ` · ${formatKm(distance)} away`}`
              : 'You have reached all planned stops.'
            : 'Waiting for your location…'}
        </p>
      ) : null}
      {!tracking && nextTarget ? (
        <button className="text-button" type="button" onClick={() => markVisited(nextTarget)}>
          I arrived at {nextTarget.name}
        </button>
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
      <p className="local-note">Progress and feedback stay in this browser. Location is only watched while tracking is on.</p>
    </section>
  )
}
