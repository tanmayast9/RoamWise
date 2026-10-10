import { categoryLabel } from '../lib/discover'
import { formatKm } from '../lib/geo'
import { entryFee, googleMapsUrl } from '../lib/placeInfo'
import CommunityReviews from './CommunityReviews'

export default function DiscoveryPanel({
  nearby,
  pinnedIds,
  selectedId,
  onSelect,
  onTogglePin,
  profile,
  reviews,
  helpfulReviews,
  onAddReview,
  onHelpful,
  onSignIn,
}) {
  return (
    <section className="section discovery-section">
      <div className="kicker">Along the way</div>
      <h3>Nearby discoveries</h3>
      {!nearby.length ? (
        <p className="empty">
          Plan a walk to surface parks, tiffin rooms, temples, and markets near the footpath.
        </p>
      ) : (
        <div className="cards">
          {nearby.map((place) => {
            const pinned = pinnedIds.includes(place.id)
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
                <h4>
                  <a href={googleMapsUrl(place)} target="_blank" rel="noreferrer">{place.name}</a>
                </h4>
                <p className="meta">
                  {place.neighborhood} · {place.visitMinutes} min · best {place.bestTime}
                </p>
                <p>{place.description}</p>
                <p className="fee-note"><strong>Entry:</strong> {entryFee(place)}</p>
                <p className="culture-note">{place.foodTip}</p>
                <div className="card-actions">
                  <button type="button" onClick={() => onSelect(place.id)}>Select on map</button>
                  <button
                    type="button"
                    className={pinned ? 'primary' : ''}
                    onClick={() => onTogglePin(place.id)}
                  >
                    {pinned ? 'In itinerary' : 'Add stop'}
                  </button>
                  <a
                    className="maps-button"
                    href={googleMapsUrl(place)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Google Maps ↗
                  </a>
                </div>
                <CommunityReviews
                  place={place}
                  profile={profile}
                  reviews={reviews}
                  helpfulReviews={helpfulReviews}
                  onAddReview={onAddReview}
                  onHelpful={onHelpful}
                  onSignIn={onSignIn}
                />
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
