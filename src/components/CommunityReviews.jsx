import { useState } from 'react'
import { entryFee, googleMapsUrl } from '../lib/placeInfo'

function SharePlace({ place }) {
  const [message, setMessage] = useState('')

  async function handleShare() {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, Bengaluru`)}`
    try {
      if (navigator.share) {
        await navigator.share({ title: place.name, text: `Explore ${place.name} in Bengaluru`, url })
        setMessage('Place shared.')
      } else {
        await navigator.clipboard.writeText(url)
        setMessage('Google Maps link copied.')
      }
    } catch (error) {
      if (error.name === 'AbortError') return
      setMessage('Could not share this place. Try its Google Maps link instead.')
    }
  }

  return (
    <span className="share-control">
      <button type="button" className="text-button" onClick={handleShare}>Share</button>
      {message ? <span className="share-message" role="status">{message}</span> : null}
    </span>
  )
}

export default function CommunityReviews({
  place,
  profile,
  reviews,
  helpfulReviews,
  onAddReview,
  onHelpful,
  onSignIn,
}) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const placeReviews = reviews[place.id] || []
  const average = placeReviews.length
    ? (placeReviews.reduce((total, review) => total + review.rating, 0) / placeReviews.length).toFixed(1)
    : null

  function handleSubmit(event) {
    event.preventDefault()
    const text = comment.trim()
    if (!text) return
    onAddReview(place.id, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      rating,
      comment: text,
      author: profile.displayName,
      helpful: 0,
      createdAt: new Date().toISOString(),
    })
    setComment('')
    setRating(5)
  }

  return (
    <details className="community">
      <summary>
        Your local reviews
        <span>{average ? `${average} ★ · ` : ''}{placeReviews.length} reviews</span>
      </summary>
      <p className="fee-note"><strong>Entry:</strong> {entryFee(place)}</p>
      <div className="community-reviews">
        {placeReviews.slice(0, 3).map((review) => {
          const helpful = helpfulReviews.includes(review.id)
          return (
            <article className="review" key={review.id}>
              <div className="review-heading">
                <strong>{review.author}</strong>
                <span aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              <p>{review.comment}</p>
              <button
                type="button"
                className={`text-button ${helpful ? 'helpful-on' : ''}`}
                onClick={() => onHelpful(review.id)}
                aria-pressed={helpful}
              >
                Helpful · {review.helpful + (helpful ? 1 : 0)}
              </button>
            </article>
          )
        })}
      </div>
      {profile ? (
        <form className="review-form" onSubmit={handleSubmit}>
          <label htmlFor={`rating-${place.id}`}>Your rating</label>
          <select
            id={`rating-${place.id}`}
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
          >
            {[5, 4, 3, 2, 1].map((score) => (
              <option key={score} value={score}>{score} {score === 1 ? 'star' : 'stars'}</option>
            ))}
          </select>
          <label htmlFor={`review-${place.id}`}>Add a review</label>
          <textarea
            id={`review-${place.id}`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={500}
            required
            placeholder="Share a useful tip for other walkers…"
          />
          <button className="review-submit" type="submit">Post review</button>
        </form>
      ) : (
        <button className="text-button" type="button" onClick={onSignIn}>Sign in to write a review</button>
      )}
      <SharePlace place={place} />
      <a className="google-reviews-link" href={googleMapsUrl(place)} target="_blank" rel="noreferrer">
        Read Google reviews and ratings ↗
      </a>
      <p className="local-note">
        Google reviews open on Google Maps. Your reviews and helpful votes are saved on this device only.
      </p>
    </details>
  )
}
