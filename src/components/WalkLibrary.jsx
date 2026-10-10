import { useMemo, useState } from 'react'
import { formatKm, formatMinutes, haversineMeters, walkMinutesForDistance } from '../lib/geo'
import { EXPERIENCE_PACKS } from '../data/experiences'

function estimatePack(pack, landmarksById, placesById) {
  const points = [
    landmarksById.get(pack.startId),
    ...pack.stopIds.map((id) => placesById.get(id)),
    landmarksById.get(pack.destId),
  ].filter(Boolean)
  const straightLineMeters = points.slice(1).reduce(
    (total, point, index) => total + haversineMeters(points[index], point),
    0,
  )
  const approximateDistance = straightLineMeters * 1.22
  const visitMinutes = pack.stopIds.reduce(
    (total, id) => total + (Number(placesById.get(id)?.visitMinutes) || 0),
    0,
  )
  const walkingMinutes = walkMinutesForDistance(approximateDistance, 'steady')
  return {
    distance: approximateDistance,
    duration: Math.ceil(walkingMinutes + visitMinutes),
    stopNames: pack.stopIds.map((id) => placesById.get(id)?.name).filter(Boolean),
  }
}

export default function WalkLibrary({
  landmarks,
  places,
  savedWalks,
  favoriteIds,
  completedWalks,
  visitedPlaceIds,
  onSave,
  onLoad,
  onUpdate,
  onDelete,
  onSaveJournal,
  onSelectFavorite,
}) {
  const [name, setName] = useState('')
  const [journalDrafts, setJournalDrafts] = useState({})
  const [shareMessage, setShareMessage] = useState('')
  const [previewId, setPreviewId] = useState(null)
  const landmarksById = useMemo(() => new Map(landmarks.map((item) => [item.id, item])), [landmarks])
  const placesById = useMemo(() => new Map(places.map((item) => [item.id, item])), [places])
  const packs = useMemo(
    () => EXPERIENCE_PACKS.map((pack) => ({ ...pack, ...estimatePack(pack, landmarksById, placesById) })),
    [landmarksById, placesById],
  )
  const favorites = (Array.isArray(favoriteIds) ? favoriteIds : [])
    .map((id) => placesById.get(id))
    .filter(Boolean)
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
  const safeCompletedWalks = Array.isArray(completedWalks)
    ? completedWalks.filter((walk) =>
      walk &&
      typeof walk.id === 'string' &&
      typeof walk.title === 'string' &&
      Array.isArray(walk.placeNames) &&
      Array.isArray(walk.categories) &&
      Array.isArray(walk.placeIds),
    )
    : []

  function submitSave(event) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSave(trimmedName)
    setName('')
  }

  const safeVisitedIds = Array.isArray(visitedPlaceIds) ? visitedPlaceIds : []
  const uniqueVisitedPlaces = new Set([
    ...safeVisitedIds,
    ...safeCompletedWalks.flatMap((walk) => walk.placeIds),
  ])
  const achievements = [
    { title: 'First Walk', earned: safeCompletedWalks.length >= 1 },
    { title: 'Heritage Explorer', earned: safeCompletedWalks.some((walk) => walk.categories.includes('heritage')) },
    { title: 'Food Trail Finisher', earned: safeCompletedWalks.some((walk) => walk.categories.includes('food')) },
    { title: 'Five Places Visited', earned: uniqueVisitedPlaces.size >= 5 },
  ]

  async function shareRecap(walk) {
    const text = [
      `RoamWise walk: ${walk.title}`,
      `Places: ${(walk.placeNames || []).join(', ') || 'No stop details saved'}`,
      `Estimated distance: ${formatKm(walk.totalDistance || 0)}`,
      `Estimated time: ${formatMinutes(walk.totalMinutes || 0)}`,
    ].join('\n')
    try {
      if (navigator.share) {
        await navigator.share({ title: walk.title, text })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      } else {
        throw new Error('Sharing and clipboard are not available in this browser.')
      }
      setShareMessage('Walk recap shared or copied.')
    } catch (error) {
      if (error.name !== 'AbortError') setShareMessage(error.message || 'Could not share the walk recap.')
    }
  }

  return (
    <section className="walk-library">
      <details>
        <summary>Saved walks and favourites</summary>
        <form className="save-walk-form" onSubmit={submitSave}>
          <label htmlFor="saved-walk-name">Save the current walk</label>
          <div className="save-walk-row">
            <input
              id="saved-walk-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              placeholder="Name this walk"
              required
            />
            <button className="text-button" type="submit">Save</button>
          </div>
        </form>
        <div className="saved-walk-list">
          <h4>Saved itineraries</h4>
          {safeSavedWalks.length ? safeSavedWalks.map((walk) => (
            <article className="saved-walk-item" key={walk.id}>
              <div>
                <strong>{walk.name}</strong>
                <p className="meta">
                  {walk.startName} to {walk.destName} · {walk.stopIds.length} stops
                </p>
              </div>
              <div className="saved-walk-actions">
                <button type="button" className="text-button" onClick={() => onLoad(walk)}>Load / resume</button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    if (window.confirm(`Replace "${walk.name}" with the current planner itinerary?`)) {
                      onUpdate(walk.id)
                    }
                  }}
                >Update</button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    if (window.confirm(`Delete "${walk.name}"?`)) onDelete(walk.id)
                  }}
                >Delete</button>
              </div>
            </article>
          )) : <p className="empty">Save a walk to find it here on this device.</p>}
        </div>
        <div className="favorite-list">
          <h4>Favourite places</h4>
          {favorites.length ? favorites.map((place) => (
            <button
              type="button"
              className="favorite-place"
              key={place.id}
              onClick={() => onSelectFavorite(place.id)}
            >
              <span>{place.name}</span>
              <span className="meta">{place.neighborhood}</span>
            </button>
          )) : <p className="empty">Use the heart action on a discovery to save a favourite.</p>}
        </div>
        <p className="local-note">Saved walks and favourites are stored only in this browser.</p>
      </details>
      <details>
        <summary>My visited places</summary>
        <ul className="visited-place-list">
          {safeVisitedIds.map((id) => {
            const place = placesById.get(id)
            return place ? <li key={id}>{place.name} <span className="meta">· {place.neighborhood}</span></li> : null
          })}
        </ul>
        {!safeVisitedIds.length ? <p className="empty">Visited places you mark during a walk appear here.</p> : null}
      </details>
      <details>
        <summary>Curated themed walk packs</summary>
        <p className="pack-disclaimer">
          Packs use places already in the guide. Distance and total time below are rough planning estimates;
          a route is requested when you load a pack.
        </p>
        <div className="experience-packs">
          {packs.map((pack) => (
            <article className="experience-pack" key={pack.id}>
              <h4>{pack.title}</h4>
              <p>{pack.introduction}</p>
              <p className="meta">
                {pack.stopNames.length} stops · about {formatKm(pack.distance)} · about {formatMinutes(pack.duration)}
              </p>
              <button
                type="button"
                className="text-button"
                aria-expanded={previewId === pack.id}
                onClick={() => setPreviewId((current) => current === pack.id ? null : pack.id)}
              >
                {previewId === pack.id ? 'Hide preview' : 'Preview stops'}
              </button>
              {previewId === pack.id ? (
                <div className="experience-pack-preview">
                  <strong>Suggested stops</strong>
                  <ul>{pack.stopNames.map((stop) => <li key={stop}>{stop}</li>)}</ul>
                  <p className="meta">Approximate distance/time are estimates based on straight-line spacing and visit durations.</p>
                  <button type="button" className="text-button" onClick={() => onLoad(pack)}>
                    Load and customize this walk
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </details>
      <details>
        <summary>Walk Passport and travel journal</summary>
        <p className="passport-summary">
          {safeCompletedWalks.length} completed {safeCompletedWalks.length === 1 ? 'walk' : 'walks'} · {uniqueVisitedPlaces.size} distinct places
        </p>
        <div className="achievement-list">
          {achievements.map((achievement) => (
            <span
              key={achievement.title}
              className={`achievement ${achievement.earned ? 'earned' : ''}`}
              aria-label={`${achievement.title}: ${achievement.earned ? 'earned' : 'not yet earned'}`}
            >
              {achievement.earned ? '✓ ' : '○ '}{achievement.title}
            </span>
          ))}
        </div>
        {safeCompletedWalks.length ? safeCompletedWalks.map((walk) => (
          <article className="journal-entry" key={walk.id}>
            <div className="journal-heading">
              <div>
                <strong>{walk.title}</strong>
                <p className="meta">
                  {walk.completedAt ? new Date(walk.completedAt).toLocaleDateString() : 'Date unavailable'} ·
                  {' '}{formatKm(walk.totalDistance || 0)} estimated · {formatMinutes(walk.totalMinutes || 0)} estimated
                </p>
              </div>
              <button type="button" className="text-button" onClick={() => shareRecap(walk)}>Share recap</button>
            </div>
            <label className="sr-only" htmlFor={`journal-${walk.id}`}>Journal note</label>
            <textarea
              id={`journal-${walk.id}`}
              maxLength={1000}
              placeholder="Add a private note about this walk…"
              value={journalDrafts[walk.id] ?? walk.journalNote ?? ''}
              onChange={(event) => setJournalDrafts((current) => ({ ...current, [walk.id]: event.target.value }))}
            />
            <button
              type="button"
              className="text-button"
              onClick={() => onSaveJournal(walk.id, journalDrafts[walk.id] ?? walk.journalNote ?? '')}
            >
              Save journal note
            </button>
          </article>
        )) : <p className="empty">Complete a walk by visiting or skipping each planned stop and marking the destination visited.</p>}
        {shareMessage ? <p className="local-note" role="status">{shareMessage}</p> : null}
        <p className="local-note">Passport, journal, and completion history are saved only in this browser.</p>
      </details>
      <details>
        <summary>Practical information and data limits</summary>
        <ul className="travel-data-notes">
          <li>Weather forecasts are unavailable because no weather provider is configured.</li>
          <li>Accessibility status is unknown and the walking route is not accessibility-assessed.</li>
          <li>There is no verified nearby restroom, drinking-water, pharmacy, or transit-facility dataset.</li>
          <li>Current food, activity, and transport prices are unknown; confirm ticketed venue rates directly.</li>
          <li>Dietary filters and Kannada/Hindi phrases are not shown because reviewed tags and translations are not in the data.</li>
        </ul>
      </details>
    </section>
  )
}
