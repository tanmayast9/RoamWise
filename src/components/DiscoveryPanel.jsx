import { useEffect, useRef, useState } from 'react'
import { categoryLabel, filterFoodPlaces, FOOD_FILTERS } from '../lib/discover'
import { formatKm } from '../lib/geo'
import { entryFee, googleMapsUrl } from '../lib/placeInfo'
import CommunityReviews from './CommunityReviews'

function ActionIcon({ name }) {
  const paths = {
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    add: <><path d="M12 5v14M5 12h14" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    favorite: <path d="M20.8 8.8c0 5.2-8.8 11-8.8 11S3.2 14 3.2 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    maps: <><path d="M14 3h7v7M10 14 21 3" /><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" /></>,
    reviews: <><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></>,
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

export default function DiscoveryPanel({
  nearby,
  pinnedIds,
  selectedId,
  onSelect,
  onTogglePin,
  favoriteIds,
  onToggleFavorite,
  profile,
  reviews,
  helpfulReviews,
  onAddReview,
  onHelpful,
  onSignIn,
}) {
  const [reviewPlace, setReviewPlace] = useState(null)
  const [detailsPlace, setDetailsPlace] = useState(null)
  const [category, setCategory] = useState('all')
  const [foodFilter, setFoodFilter] = useState('')
  const dialogRef = useRef(null)
  const detailsDialogRef = useRef(null)

  useEffect(() => {
    if (reviewPlace) dialogRef.current?.showModal()
  }, [reviewPlace])

  useEffect(() => {
    if (detailsPlace) detailsDialogRef.current?.showModal()
  }, [detailsPlace])

  let filteredPlaces = category === 'all'
    ? nearby
    : nearby.filter((place) => place.category === category)
  if (category === 'food' && foodFilter) {
    filteredPlaces = filterFoodPlaces(filteredPlaces, foodFilter)
  }

  return (
    <details className="planner-disclosure planner-discovery-disclosure">
      <summary className="planner-disclosure-summary">
        <span>
          <span className="kicker">Along the way</span>
          <span className="planner-disclosure-title">Nearby discoveries</span>
        </span>
        <span className="planner-discovery-count">
          {nearby.length} {nearby.length === 1 ? 'place' : 'places'}
        </span>
        <span className="planner-disclosure-chevron" aria-hidden="true" />
      </summary>
      <section className="section discovery-section">
        <div className="discovery-heading">
          <label className="sr-only" htmlFor="discovery-category">Filter nearby places</label>
          <select
            id="discovery-category"
            className="discovery-filter"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All categories</option>
            <option value="food">Food</option>
            <option value="heritage">Heritage</option>
            <option value="architecture">Architecture</option>
            <option value="park">Parks</option>
            <option value="culture">Culture</option>
            <option value="market">Markets</option>
          </select>
          {category === 'food' ? (
            <select
              aria-label="Filter food discoveries"
              className="discovery-filter"
              value={foodFilter}
              onChange={(event) => setFoodFilter(event.target.value)}
            >
              <option value="">All food places</option>
              {FOOD_FILTERS.map((filter) => (
                <option
                  key={filter.id}
                  value={filter.id}
                  disabled={!filter.available(nearby)}
                >
                  {filter.label}{filter.available(nearby) ? '' : ' — data unavailable'}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        {category === 'food' ? (
          <p className="meta food-filter-note">
            Dietary, cuisine, and price filters stay disabled until those venue details are verified. Quick-stop filtering uses estimated visit times.
          </p>
        ) : null}
        {!filteredPlaces.length ? (
          <p className="empty">
            {nearby.length
              ? category === 'food' && foodFilter
                ? 'No food places in this curated set have the selected attribute. Dietary, specialty, and price tags are unverified or unavailable.'
                : 'No nearby places match this category.'
              : 'Plan a walk to surface parks, tiffin rooms, temples, and markets near the footpath.'}
          </p>
        ) : (
          <div className="cards" aria-label="Nearby places; scroll vertically to browse">
            {filteredPlaces.map((place) => {
              const pinned = pinnedIds.includes(place.id)
              const favorite = favoriteIds.includes(place.id)
              const mapsUrl = googleMapsUrl(place)
              return (
                <article
                  key={place.id}
                  className={`place-card ${selectedId === place.id ? 'selected' : ''}`}
                >
                  <div className="place-top">
                    <span className="cat">{categoryLabel(place.category)}</span>
                    <span className="meta">
                      {Number.isFinite(place.distanceFromRoute)
                        ? `${formatKm(place.distanceFromRoute)} off path`
                        : place.neighborhood}
                    </span>
                  </div>
                  <h4>{place.name}</h4>
                  <p className="meta place-subtitle">
                    {place.neighborhood} · {place.visitMinutes} min · best {place.bestTime}
                  </p>
                  <p className="place-description">{place.description}</p>
                  <div className="card-actions">
                    <button
                      type="button"
                      aria-label={`Select ${place.name} on map`}
                      title="Select on map"
                      onClick={() => onSelect(place.id)}
                    >
                      <ActionIcon name="pin" />
                    </button>
                    <button
                      type="button"
                      className={pinned ? 'primary' : ''}
                      aria-label={pinned ? `Remove ${place.name} from itinerary` : `Add ${place.name} to itinerary`}
                      aria-pressed={pinned}
                      title={pinned ? 'In itinerary' : 'Add to itinerary'}
                      onClick={() => onTogglePin(place.id)}
                    >
                      <ActionIcon name={pinned ? 'check' : 'add'} />
                    </button>
                    <button
                      type="button"
                      className={favorite ? 'favorite-on' : ''}
                      aria-label={favorite ? `Remove ${place.name} from favourites` : `Save ${place.name} to favourites`}
                      aria-pressed={favorite}
                      title={favorite ? 'Favourite' : 'Save favourite'}
                      onClick={() => onToggleFavorite(place.id)}
                    >
                      <ActionIcon name="favorite" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Tell me more about ${place.name}`}
                      title="Tell me more"
                      onClick={() => setDetailsPlace(place)}
                    >
                      <ActionIcon name="info" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Read local reviews for ${place.name}`}
                      title="Local reviews"
                      onClick={() => setReviewPlace(place)}
                    >
                      <ActionIcon name="reviews" />
                    </button>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${place.name} in Google Maps`}
                      title="Open in Google Maps"
                    >
                      <ActionIcon name="maps" />
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
      <dialog
        ref={dialogRef}
        className="discovery-reviews-dialog"
        onClose={() => setReviewPlace(null)}
      >
        {reviewPlace ? (
          <div className="discovery-reviews-content">
            <div className="discovery-reviews-heading">
              <h3>Reviews · {reviewPlace.name}</h3>
              <button
                type="button"
                className="discovery-review-close"
                aria-label="Close reviews"
                onClick={() => dialogRef.current?.close()}
              >
                ×
              </button>
            </div>
            <CommunityReviews
              place={reviewPlace}
              profile={profile}
              reviews={reviews}
              helpfulReviews={helpfulReviews}
              onAddReview={onAddReview}
              onHelpful={onHelpful}
              onSignIn={onSignIn}
            />
          </div>
        ) : null}
      </dialog>
      <dialog
        ref={detailsDialogRef}
        className="discovery-reviews-dialog"
        onClose={() => setDetailsPlace(null)}
      >
        {detailsPlace ? (
          <div className="discovery-reviews-content">
            <div className="discovery-reviews-heading">
              <h3>{detailsPlace.name}</h3>
              <button
                type="button"
                className="discovery-review-close"
                aria-label="Close place details"
                onClick={() => detailsDialogRef.current?.close()}
              >
                ×
              </button>
            </div>
            <p className="cat">{categoryLabel(detailsPlace.category)}</p>
            <p><strong>Why visit:</strong> {detailsPlace.cultureNote || detailsPlace.description}</p>
            {detailsPlace.recommendationReason ? (
              <p><strong>Recommended because:</strong> {detailsPlace.recommendationReason}</p>
            ) : null}
            <p>{detailsPlace.description}</p>
            {detailsPlace.foodTip ? <p><strong>Local tip:</strong> {detailsPlace.foodTip}</p> : null}
            <p><strong>Area:</strong> {detailsPlace.neighborhood}</p>
            <p><strong>Estimated visit:</strong> {detailsPlace.visitMinutes} minutes</p>
            {Number.isFinite(detailsPlace.distanceFromRoute) ? (
              <p><strong>Approximate distance from route:</strong> {formatKm(detailsPlace.distanceFromRoute)}</p>
            ) : null}
            <p><strong>Entry information:</strong> {entryFee(detailsPlace)}</p>
            <p className="local-note">
              Place information is from the curated RoamWise guide; independent source metadata is not available in this record.
              Accessibility information is unknown and route accessibility is not assessed; confirm with the venue before visiting.
            </p>
          </div>
        ) : null}
      </dialog>
    </details>
  )
}
