import { useMemo, useState } from 'react'
import { categoryLabel } from '../lib/discover'
import { formatKm, formatMinutes, haversineMeters, walkMinutesForDistance } from '../lib/geo'
import { entryFee, googleMapsUrl } from '../lib/placeInfo'
import MapView from './MapView'
import CommunityReviews from './CommunityReviews'

const CATEGORIES = ['all', 'heritage', 'food', 'park', 'architecture', 'culture', 'market']

function Link({ to, navigate, className = '', children, ...props }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) return
        event.preventDefault()
        navigate(to)
      }}
      {...props}
    >
      {children}
    </a>
  )
}

function PageIntro({ eyebrow, title, text, action, navigate }) {
  return (
    <header className="site-page-intro">
      <p className="kicker">{eyebrow}</p>
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
      {action ? <Link className="site-button site-button-primary" to={action.to} navigate={navigate}>{action.label}</Link> : null}
    </header>
  )
}

function PlaceCard({ place, navigate, selected, onSelect, favorite, onFavorite, onAdd }) {
  return (
    <article className={`site-place-card ${selected ? 'is-selected' : ''}`}>
      <div className="site-place-card-top">
        <span className={`site-category category-${place.category}`}>{categoryLabel(place.category)}</span>
        <button
          className={`site-icon-button ${favorite ? 'is-favorite' : ''}`}
          type="button"
          aria-label={`${favorite ? 'Remove' : 'Save'} ${place.name} ${favorite ? 'from' : 'to'} favourites`}
          aria-pressed={favorite}
          onClick={() => onFavorite(place.id)}
        >
          {favorite ? '♥' : '♡'}
        </button>
      </div>
      <h3><Link to={`/places/${place.id}`} navigate={navigate}>{place.name}</Link></h3>
      <p className="site-place-meta">{place.neighborhood} · about {place.visitMinutes} min</p>
      <p className="site-place-description">{place.description}</p>
      <div className="site-place-actions">
        <button className="site-button site-button-secondary" type="button" onClick={() => onSelect(place.id)}>
          Show on map
        </button>
        <button className="site-button site-button-secondary" type="button" onClick={() => onAdd(place.id)}>
          Add to walk
        </button>
      </div>
    </article>
  )
}

export function HomePage({ places, packs, navigate }) {
  const featured = places.filter((place) => ['st-marks', 'koshy-s', 'cubbon-park'].includes(place.id))
  return (
    <main className="site-main home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="kicker">A walking guide to Bengaluru</p>
          <h2>Take the long way.<br /><em>Find your city.</em></h2>
          <p>Build a walk around the places, flavours, and stories you care about — one neighbourhood at a time.</p>
          <div className="site-hero-actions">
            <Link className="site-button site-button-primary" to="/plan" navigate={navigate}>Plan a walk <span aria-hidden="true">→</span></Link>
            <Link className="site-button site-button-secondary" to="/experiences" navigate={navigate}>Browse walking experiences</Link>
          </div>
          <p className="home-local-note">Curated Bengaluru guide · Routes and durations are estimates</p>
        </div>
        <div className="home-hero-visual" aria-label="A walking route through central Bengaluru">
          <div className="hero-map-grid" aria-hidden="true">
            <span className="hero-road hero-road-one" />
            <span className="hero-road hero-road-two" />
            <span className="hero-road hero-road-three" />
            <span className="hero-route-line" />
            <span className="hero-map-pin hero-pin-one">1</span>
            <span className="hero-map-pin hero-pin-two">2</span>
            <span className="hero-map-pin hero-pin-three">3</span>
            <span className="hero-map-label hero-label-one">Cubbon Park</span>
            <span className="hero-map-label hero-label-two">Church Street</span>
          </div>
          <div className="hero-map-caption"><span>01</span> A city is best found on foot.</div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-section-heading">
          <div><p className="kicker">A more curious kind of city guide</p><h2>Make room for the in-between.</h2></div>
          <Link to="/about" navigate={navigate}>Why RoamWise <span aria-hidden="true">→</span></Link>
        </div>
        <div className="how-grid">
          {[
            ['01', 'Choose your waypoints', 'Set a start, destination, pace, and the things you would like to discover.'],
            ['02', 'Shape your own walk', 'Explore suggested places, compare routes, and edit your stops and time.'],
            ['03', 'Go at your pace', 'Open directions, track progress in this browser, and keep a private recap.'],
          ].map(([number, title, body]) => (
            <article className="how-card" key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>
          ))}
        </div>
      </section>

      <section className="site-section">
        <div className="site-section-heading">
          <div><p className="kicker">Start with a little inspiration</p><h2>Walks with a point of view.</h2></div>
          <Link to="/experiences" navigate={navigate}>All experiences <span aria-hidden="true">→</span></Link>
        </div>
        <div className="home-experience-grid">
          {packs.slice(0, 3).map((pack, index) => (
            <Link className={`home-experience-card home-experience-${index + 1}`} to="/experiences" navigate={navigate} key={pack.id}>
              <span>{pack.stopIds.length} curated stops</span><h3>{pack.title}</h3><p>{pack.introduction}</p>
              <span className="home-card-link">Preview walk <span aria-hidden="true">↗</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="site-section home-discover-section">
        <div className="site-section-heading">
          <div><p className="kicker">A few places to begin</p><h2>Little discoveries, all around.</h2></div>
          <Link to="/explore" navigate={navigate}>Explore all places <span aria-hidden="true">→</span></Link>
        </div>
        <div className="site-place-grid home-place-grid">
          {featured.map((place) => (
            <article className="home-feature-place" key={place.id}>
              <span className={`site-category category-${place.category}`}>{categoryLabel(place.category)}</span>
              <h3><Link to={`/places/${place.id}`} navigate={navigate}>{place.name}</Link></h3>
              <p>{place.neighborhood}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="home-final-cta">
        <p className="kicker">Your next favourite street is out there</p>
        <h2>Start with one walk.</h2>
        <Link className="site-button site-button-light" to="/plan" navigate={navigate}>Plan your Bengaluru walk <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  )
}

export function ExplorePage({
  places,
  favoriteIds,
  selectedId,
  selectionVersion,
  onSelect,
  onFavorite,
  onAdd,
  navigate,
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [area, setArea] = useState('all')
  const [duration, setDuration] = useState('all')
  const [sort, setSort] = useState('name')
  const areas = useMemo(() => [...new Set(places.map((place) => place.neighborhood))].sort(), [places])
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const matches = places.filter((place) => {
      const searchable = `${place.name} ${place.neighborhood} ${place.category} ${place.description}`.toLowerCase()
      return (!normalized || searchable.includes(normalized)) &&
        (category === 'all' || place.category === category) &&
        (area === 'all' || place.neighborhood === area) &&
        (duration === 'all' || (duration === 'short' ? place.visitMinutes <= 20 : place.visitMinutes > 20))
    })
    return matches.sort((left, right) => {
      if (sort === 'shortest') return left.visitMinutes - right.visitMinutes || left.name.localeCompare(right.name)
      if (sort === 'longest') return right.visitMinutes - left.visitMinutes || left.name.localeCompare(right.name)
      return left.name.localeCompare(right.name)
    })
  }, [places, query, category, area, duration, sort])
  const selected = places.find((place) => place.id === selectedId)

  return (
    <main className="site-main">
      <PageIntro
        eyebrow="Explore Bengaluru"
        title="Find a place to pause."
        text="Search the curated guide by place, area, or category. Venue details and visit times may change; check with the venue before you go."
        navigate={navigate}
      />
      <section className="explore-workspace" aria-label="Explore places and map">
        <div className="explore-map-panel">
          <MapView
            id="explore-map"
            nearby={filtered}
            selectedId={selectedId}
            selectionVersion={selectionVersion}
            onSelect={onSelect}
          />
          {selected ? <p className="explore-map-selected"><strong>{selected.name}</strong> · {selected.neighborhood}</p> : null}
        </div>
        <div className="explore-results">
          <div className="explore-filters">
            <label className="site-search-label" htmlFor="explore-search">Search places</label>
            <input id="explore-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “Church Street”" />
            <div className="explore-filter-row">
              <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{CATEGORIES.map((item) => <option value={item} key={item}>{item === 'all' ? 'All categories' : categoryLabel(item)}</option>)}</select></label>
              <label><span>Area</span><select value={area} onChange={(event) => setArea(event.target.value)}><option value="all">All areas</option>{areas.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
              <label><span>Visit time</span><select value={duration} onChange={(event) => setDuration(event.target.value)}><option value="all">Any duration</option><option value="short">20 min or less</option><option value="long">Over 20 min</option></select></label>
            </div>
            <label className="explore-sort-label"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Place name</option><option value="shortest">Shortest visit first</option><option value="longest">Longest visit first</option></select></label>
            <p className="site-results-count">{filtered.length} {filtered.length === 1 ? 'place' : 'places'} in the curated guide</p>
          </div>
          <div className="site-place-grid explore-place-grid">
            {filtered.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                navigate={navigate}
                selected={place.id === selectedId}
                onSelect={onSelect}
                favorite={favoriteIds.includes(place.id)}
                onFavorite={onFavorite}
                onAdd={onAdd}
              />
            ))}
            {!filtered.length ? <div className="site-empty-state"><h3>No places match these filters.</h3><p>Try another category or broaden the search.</p><button className="site-button site-button-secondary" type="button" onClick={() => { setQuery(''); setCategory('all'); setArea('all'); setDuration('all') }}>Clear filters</button></div> : null}
          </div>
        </div>
      </section>
      <p className="site-data-note">Place descriptions come from RoamWise’s curated local dataset. Live ratings, verified prices, opening hours, and accessibility details are not available here.</p>
    </main>
  )
}

function packEstimate(pack, places, landmarks) {
  const byPlace = new Map(places.map((place) => [place.id, place]))
  const byLandmark = new Map(landmarks.map((place) => [place.id, place]))
  const points = [
    byLandmark.get(pack.startId),
    ...pack.stopIds.map((id) => byPlace.get(id)),
    byLandmark.get(pack.destId),
  ].filter(Boolean)
  const distance = points.slice(1).reduce((sum, point, index) => sum + haversineMeters(points[index], point), 0) * 1.22
  const visit = pack.stopIds.reduce((sum, id) => sum + (Number(byPlace.get(id)?.visitMinutes) || 0), 0)
  return { distance, duration: walkMinutesForDistance(distance, 'steady') + visit }
}

export function ExperiencesPage({ packs, places, landmarks, onLoad, navigate }) {
  return (
    <main className="site-main">
      <PageIntro
        eyebrow="Walking experiences"
        title="A walk for the way you feel."
        text="Choose a curated starting point, then adjust its places, pace, and time in the planner. Estimates are approximate until a route is requested."
        action={{ to: '/plan', label: 'Build your own walk' }}
        navigate={navigate}
      />
      <section className="experience-page-grid" aria-label="Curated walks">
        {packs.map((pack, index) => {
          const estimate = packEstimate(pack, places, landmarks)
          const stops = pack.stopIds.map((id) => places.find((place) => place.id === id)).filter(Boolean)
          return (
            <article className={`experience-page-card experience-page-card-${index % 4}`} key={pack.id}>
              <p className="kicker">Bengaluru · Curated route</p>
              <h3>{pack.title}</h3>
              <p>{pack.introduction}</p>
              <div className="experience-meta"><span>About {formatKm(estimate.distance)}</span><span>About {formatMinutes(estimate.duration)}</span>              <span>{stops.length} {stops.length === 1 ? 'stop' : 'stops'}</span></div>
              <details className="experience-stops">
                <summary>Preview stops</summary>
                <ol>{stops.map((place) => <li key={place.id}><Link to={`/places/${place.id}`} navigate={navigate}>{place.name}</Link><span>{place.neighborhood}</span></li>)}</ol>
              </details>
              <button className="site-button site-button-primary" type="button" onClick={() => { onLoad(pack); navigate('/plan') }}>Load and customize <span aria-hidden="true">→</span></button>
              <p className="site-small-note">Distance and time are rough planning estimates, not a verified route.</p>
            </article>
          )
        })}
      </section>
    </main>
  )
}

export function PlaceDetailPage({
  place,
  places,
  favorite,
  onFavorite,
  onAdd,
  reviews,
  helpfulReviews,
  profile,
  onAddReview,
  onHelpful,
  onSignIn,
  navigate,
}) {
  const [shareMessage, setShareMessage] = useState('')
  const nearby = place
    ? places.filter((item) => item.id !== place.id && haversineMeters(item, place) <= 1800).slice(0, 4)
    : []
  if (!place) return <NotFoundPage navigate={navigate} />
  async function sharePlace() {
    const url = googleMapsUrl(place)
    try {
      if (navigator.share) {
        await navigator.share({ title: place.name, text: `Explore ${place.name} in Bengaluru.`, url })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
      } else {
        throw new Error('Sharing is not available in this browser.')
      }
      setShareMessage('Place link shared or copied.')
    } catch (error) {
      if (error.name !== 'AbortError') setShareMessage(error.message || 'Could not share this place.')
    }
  }
  return (
    <main className="site-main place-detail-page">
      <nav className="site-breadcrumbs" aria-label="Breadcrumb"><Link to="/" navigate={navigate}>Home</Link><span>/</span><Link to="/explore" navigate={navigate}>Explore</Link><span>/</span><span aria-current="page">{place.name}</span></nav>
      <section className="place-detail-hero">
        <div><p className="kicker">{categoryLabel(place.category)} · {place.neighborhood}</p><h2>{place.name}</h2><p>{place.description}</p>
          <div className="place-detail-actions">
            <button className="site-button site-button-primary" type="button" onClick={() => onAdd(place.id)}>Add to itinerary</button>
            <button className="site-button site-button-secondary" type="button" aria-pressed={favorite} onClick={() => onFavorite(place.id)}>{favorite ? 'Saved to favourites' : 'Save place'}</button>
            <button className="site-button site-button-secondary" type="button" onClick={sharePlace}>Share place</button>
            <a className="site-button site-button-secondary" href={googleMapsUrl(place)} target="_blank" rel="noreferrer">Open in Google Maps ↗</a>
          </div>
          {shareMessage ? <p className="site-small-note" role="status">{shareMessage}</p> : null}
        </div>
        <div className={`place-detail-art category-art-${place.category}`} aria-hidden="true"><span>{categoryLabel(place.category)}</span><strong>{place.name}</strong></div>
      </section>
      <section className="place-facts-grid">
        <article><span>Estimated visit</span><strong>About {place.visitMinutes} minutes</strong></article>
        <article><span>Area</span><strong>{place.neighborhood}</strong></article>
        <article><span>Entry information</span><strong>{entryFee(place)}</strong></article>
      </section>
      {place.cultureNote ? <section className="place-context"><p className="kicker">Local context</p><h3>A detail to look for</h3><p>{place.cultureNote}</p></section> : null}
      {place.foodTip ? <section className="place-context"><p className="kicker">A nearby idea</p><h3>Food and refreshments</h3><p>{place.foodTip}</p><p className="site-small-note">Suggestions are curated notes, not a live business directory. Check current availability directly.</p></section> : null}
      <section className="place-context">
        <p className="kicker">Find your way</p>
        <h3>Location and nearby places</h3>
        <div className="place-detail-map">
          <MapView
            id="place-map"
            nearby={[place, ...nearby]}
            selectedId={place.id}
            selectionVersion={0}
            onSelect={(id) => navigate(`/places/${id}`)}
          />
        </div>
      </section>
      <section className="place-context">
        <p className="kicker">Walker notes</p>
        <h3>Reviews from this browser</h3>
        <CommunityReviews
          place={place}
          profile={profile}
          reviews={reviews}
          helpfulReviews={helpfulReviews}
          onAddReview={onAddReview}
          onHelpful={onHelpful}
          onSignIn={onSignIn}
        />
      </section>
      <section className="place-context">
        <div className="site-section-heading"><div><p className="kicker">Close by</p><h3>Other places in this guide</h3></div><Link to="/explore" navigate={navigate}>Back to explore →</Link></div>
        <div className="site-place-grid related-place-grid">{nearby.map((item) => <article className="home-feature-place" key={item.id}><span className={`site-category category-${item.category}`}>{categoryLabel(item.category)}</span><h3><Link to={`/places/${item.id}`} navigate={navigate}>{item.name}</Link></h3><p>{item.neighborhood} · approximate proximity</p></article>)}</div>
      </section>
      <p className="site-data-note">Live opening hours, entry fees, accessibility information, and ratings are not verified by RoamWise. Please confirm with the venue before visiting.</p>
    </main>
  )
}

export function TripsPage({
  savedWalks,
  recentWalks,
  favoritePlaces,
  completedWalks,
  activeWalk,
  onLoadWalk,
  onDuplicate,
  onSaveWalk,
  onUpdateWalk,
  onDelete,
  navigate,
}) {
  const [walkName, setWalkName] = useState('')

  function saveCurrentWalk(event) {
    event.preventDefault()
    const name = walkName.trim()
    if (!name) return
    onSaveWalk(name)
    setWalkName('')
  }

  return (
    <main className="site-main">
      <PageIntro eyebrow="My trips" title="Your walks, all in one place." text="Saved walks and favourites live in this browser. They are not synced to an account or other devices." action={{ to: '/plan', label: 'Plan a new walk' }} navigate={navigate} />
      {activeWalk ? <section className="active-trip-card"><div><p className="kicker">Currently in progress</p><h2>{activeWalk.startName} <span aria-hidden="true">→</span> {activeWalk.destName}</h2><p>{activeWalk.visitedCount} visited · {activeWalk.stopCount} planned stops</p></div><Link className="site-button site-button-primary" to="/plan" navigate={navigate}>Continue this walk</Link></section> : null}
      <section className="personal-section">
        <div className="site-section-heading"><div><p className="kicker">Keep a route for later</p><h2>Save your current plan</h2></div></div>
        <form className="trip-save-form" onSubmit={saveCurrentWalk}>
          <label htmlFor="trip-walk-name">Walk name</label>
          <div><input id="trip-walk-name" value={walkName} onChange={(event) => setWalkName(event.target.value)} maxLength={60} placeholder="For example, Cubbon Park morning" required /><button className="site-button site-button-primary" type="submit">Save to My Trips</button></div>
          <p className="site-small-note">This saves the route currently selected in Plan a Walk to this browser.</p>
        </form>
      </section>
      <section className="personal-section"><div className="site-section-heading"><div><p className="kicker">Picked up along the way</p><h2>Recently planned</h2></div><span>{recentWalks.length} recent</span></div>
        {recentWalks.length ? <div className="trip-list">{recentWalks.map((walk) => <article className="trip-row" key={walk.id}><div><h3>{walk.startName} → {walk.destName}</h3><p>{walk.stopIds.length} {walk.stopIds.length === 1 ? 'stop' : 'stops'} · {walk.savedAt ? new Date(walk.savedAt).toLocaleDateString() : 'Date unavailable'}</p></div><button className="site-button site-button-secondary" type="button" onClick={() => { onLoadWalk(walk); navigate('/plan') }}>Resume recent walk</button></article>)}</div> : <p className="site-inline-empty">Walks you plan will appear here for quick access.</p>}
      </section>
      <section className="personal-section"><div className="site-section-heading"><div><p className="kicker">Ready when you are</p><h2>Saved itineraries</h2><Link to="/experiences" navigate={navigate}>Browse curated walks →</Link></div><span>{savedWalks.length} saved</span></div>
        {savedWalks.length ? <div className="trip-list">{savedWalks.map((walk) => <article className="trip-row" key={walk.id}><div><h3>{walk.name}</h3><p>{walk.startName} → {walk.destName} · {walk.stopIds.length} {walk.stopIds.length === 1 ? 'stop' : 'stops'}</p><span className="site-small-note">Saved {walk.savedAt ? new Date(walk.savedAt).toLocaleDateString() : 'date unavailable'}</span></div><div className="trip-actions"><button className="site-button site-button-primary" type="button" onClick={() => { onLoadWalk(walk); navigate('/plan') }}>Edit / resume</button><button className="site-button site-button-secondary" type="button" onClick={() => { if (window.confirm(`Replace “${walk.name}” with the current planner route?`)) onUpdateWalk(walk.id) }}>Update from current plan</button><button className="site-button site-button-secondary" type="button" onClick={() => onDuplicate(walk)}>Duplicate</button><button className="site-button site-button-danger" type="button" onClick={() => { if (window.confirm(`Delete “${walk.name}”? This cannot be undone.`)) onDelete(walk.id) }}>Delete</button></div></article>)}</div> : <div className="site-empty-state"><h3>No saved walks yet.</h3><p>Save the current plan above, or build a new itinerary.</p><Link className="site-button site-button-primary" to="/plan" navigate={navigate}>Plan a walk</Link></div>}
      </section>
      <section className="personal-section"><div className="site-section-heading"><div><p className="kicker">Places to come back to</p><h2>Favourites</h2></div><span>{favoritePlaces.length} saved</span></div>
        {favoritePlaces.length ? <div className="site-place-grid">{favoritePlaces.map((place) => <article className="home-feature-place" key={place.id}><span className={`site-category category-${place.category}`}>{categoryLabel(place.category)}</span><h3><Link to={`/places/${place.id}`} navigate={navigate}>{place.name}</Link></h3><p>{place.neighborhood}</p></article>)}</div> : <div className="site-empty-state"><h3>No favourites yet.</h3><p>Save a place with the heart button as you explore.</p><Link className="site-button site-button-secondary" to="/explore" navigate={navigate}>Explore places</Link></div>}
      </section>
      <section className="personal-section"><div className="site-section-heading"><div><p className="kicker">On foot, in real life</p><h2>Completed walks</h2></div><span>{completedWalks.length} completed</span></div>
        {completedWalks.length ? <div className="completed-walk-grid">{completedWalks.map((walk) => <article key={walk.id}><p className="kicker">{walk.completedAt ? new Date(walk.completedAt).toLocaleDateString() : 'Completed walk'}</p><h3>{walk.title}</h3><p>{walk.placeNames.join(' · ') || 'No place details saved'}</p><span>{formatKm(walk.totalDistance || 0)} estimated · {formatMinutes(walk.totalMinutes || 0)} estimated</span></article>)}</div> : <p className="site-inline-empty">Completed walks appear here after you finish a tracked walk.</p>}
      </section>
    </main>
  )
}

export function PassportPage({ visitedPlaces, completedWalks, favoritePlaces, onSaveJournal, navigate }) {
  const [journalDrafts, setJournalDrafts] = useState({})
  const [shareMessage, setShareMessage] = useState('')
  const categories = new Set(visitedPlaces.map((place) => place.category))
  const badges = [
    ['First steps', completedWalks.length > 0, 'Finish a walk to earn this badge.'],
    ['Green detour', visitedPlaces.some((place) => place.category === 'park'), 'Visit a park in the curated guide.'],
    ['A taste of Bengaluru', visitedPlaces.some((place) => place.category === 'food'), 'Visit a food stop.'],
    ['City stories', categories.has('heritage') || categories.has('architecture'), 'Visit a heritage or architecture place.'],
    ['Five places', new Set(visitedPlaces.map((place) => place.id)).size >= 5, 'Mark five distinct places as visited.'],
  ]
  async function shareRecap(walk) {
    const recap = `RoamWise walk: ${walk.title}\nPlaces: ${(walk.placeNames || []).join(', ') || 'No stop details saved'}\nEstimated distance: ${formatKm(walk.totalDistance || 0)}\nEstimated time: ${formatMinutes(walk.totalMinutes || 0)}`
    try {
      if (navigator.share) {
        await navigator.share({ title: walk.title, text: recap })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(recap)
      } else {
        throw new Error('Sharing is not available in this browser.')
      }
      setShareMessage('Walk recap shared or copied.')
    } catch (error) {
      if (error.name !== 'AbortError') setShareMessage(error.message || 'Could not share the recap.')
    }
  }
  return (
    <main className="site-main passport-page">
      <PageIntro eyebrow="My RoamWise · Travel Passport" title="A record of the city you’ve walked." text="Your progress and achievements are private to this browser. Badges are based on places you mark visited and walks you complete." action={{ to: '/plan', label: 'Continue a walk' }} navigate={navigate} />
      <section className="passport-stats">{[[new Set(visitedPlaces.map((place) => place.id)).size, 'places visited'], [completedWalks.length, 'walks completed'], [favoritePlaces.length, 'saved places']].map(([value, label]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}</section>
      <section className="personal-section"><p className="kicker">Earned by exploring</p><h2>Your badges</h2><div className="passport-badges">{badges.map(([title, earned, hint]) => <article className={earned ? 'is-earned' : ''} key={title}><span aria-hidden="true">{earned ? '✳' : '○'}</span><div><h3>{title}</h3><p>{earned ? 'Earned' : hint}</p></div></article>)}</div></section>
      <section className="personal-section"><div className="site-section-heading"><div><p className="kicker">Your footsteps</p><h2>Visited places</h2></div><Link to="/explore" navigate={navigate}>Find another place →</Link></div>
        {visitedPlaces.length ? <ul className="passport-visited-list">{visitedPlaces.map((place) => <li key={place.id}><span className={`site-category category-${place.category}`}>{categoryLabel(place.category)}</span><Link to={`/places/${place.id}`} navigate={navigate}>{place.name}</Link><span>{place.neighborhood}</span></li>)}</ul> : <div className="site-empty-state"><h3>Your passport starts with a walk.</h3><p>Mark a stop visited during an active walk to see it here.</p></div>}
      </section>
      <section className="personal-section">
        <div className="site-section-heading"><div><p className="kicker">Walk journal</p><h2>Keep a note of the day.</h2></div></div>
        {completedWalks.length ? <div className="passport-journal">
          {completedWalks.map((walk) => (
            <article className="passport-journal-entry" key={walk.id}>
              <div className="site-section-heading">
                <div><p className="kicker">{walk.completedAt ? new Date(walk.completedAt).toLocaleDateString() : 'Completed walk'}</p><h3>{walk.title}</h3><p>{walk.placeNames.join(' · ') || 'No place details saved'}</p></div>
                <button className="site-button site-button-secondary" type="button" onClick={() => shareRecap(walk)}>Share recap</button>
              </div>
              <label htmlFor={`passport-note-${walk.id}`}>Private journal note</label>
              <textarea
                id={`passport-note-${walk.id}`}
                rows={3}
                maxLength={1000}
                value={journalDrafts[walk.id] ?? walk.journalNote ?? ''}
                onChange={(event) => setJournalDrafts((current) => ({ ...current, [walk.id]: event.target.value }))}
                placeholder="What would you like to remember about this walk?"
              />
              <button className="site-button site-button-primary" type="button" onClick={() => onSaveJournal(walk.id, journalDrafts[walk.id] ?? walk.journalNote ?? '')}>Save note on this device</button>
            </article>
          ))}
          {shareMessage ? <p className="site-form-success" role="status">{shareMessage}</p> : null}
        </div> : <div className="site-empty-state"><h3>No completed walks to journal yet.</h3><p>Finish a walk to create a private recap, then add a note here.</p></div>}
      </section>
      <section className="personal-section passport-guide-notes">
        <div className="site-section-heading"><div><p className="kicker">Your RoamWise guide</p><h2>Good to know before you go.</h2></div></div>
        <ul>
          <li>Walking times and route details are estimates; check the route before setting out.</li>
          <li>Live weather, venue hours, current prices, and ratings are not verified in RoamWise.</li>
          <li>Accessibility information and nearby facilities such as restrooms or drinking water are not verified.</li>
          <li>Your passport, notes, favourites, and trips are stored in this browser and are not synced to an account.</li>
        </ul>
        <div className="trip-actions">
          <Link className="site-button site-button-secondary" to="/explore" navigate={navigate}>Explore curated places</Link>
          <Link className="site-button site-button-secondary" to="/experiences" navigate={navigate}>Browse themed walks</Link>
          <Link className="site-button site-button-secondary" to="/about" navigate={navigate}>More about RoamWise</Link>
        </div>
      </section>
    </main>
  )
}

export function AboutPage({ navigate }) {
  return (
    <main className="site-main about-page">
      <PageIntro eyebrow="About RoamWise" title="A city is more than the quickest way through it." text="RoamWise is a walking companion for discovering Bengaluru beyond the destination — through its streets, green spaces, food, architecture, and everyday details." action={{ to: '/explore', label: 'Explore the city guide' }} navigate={navigate} />
      <section className="about-story-grid"><article><p className="kicker">The idea</p><h2>Leave space for the unexpected.</h2><p>Turn-by-turn directions are useful. But the in-between can be the best part of a day out: a shaded path, a familiar coffee stop, a facade you have never noticed. RoamWise helps walkers make time for those pauses.</p></article><article><p className="kicker">How we work</p><h2>Local discovery, without pretending to know everything.</h2><p>We connect a growing, hand-curated set of Bengaluru places with route planning and editable walks. Travel times are estimates, and information that is not verified — such as live hours, prices, accessibility, or ratings — is clearly called out.</p></article></section>
      <section className="home-final-cta"><p className="kicker">For visitors and lifelong locals</p><h2>Make your next walk your own.</h2><Link className="site-button site-button-light" to="/plan" navigate={navigate}>Plan a walk →</Link></section>
    </main>
  )
}

export function FeedbackPage({ feedbackItems, setFeedbackItems, navigate }) {
  const [kind, setKind] = useState('product')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    const cleanMessage = message.trim()
    const cleanEmail = email.trim()
    if (cleanMessage.length < 10) {
      setError('Please add at least 10 characters so your note has enough context.')
      setSaved(false)
      return
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address or leave the field blank.')
      setSaved(false)
      return
    }
    const entry = { id: `${Date.now()}`, kind, message: cleanMessage, email: cleanEmail || null, createdAt: new Date().toISOString() }
    setFeedbackItems((current) => [entry, ...(Array.isArray(current) ? current : [])])
    setMessage('')
    setEmail('')
    setSaved(true)
    setError('')
  }
  return (
    <main className="site-main feedback-page">
      <PageIntro eyebrow="Feedback & help" title="Help us make the next walk better." text="Report an issue, suggest a place, or tell us what is working. This form saves a private draft in this browser; it does not send a message to RoamWise." navigate={navigate} />
      <div className="feedback-layout">
        <form className="feedback-form" onSubmit={submit}>
          <label htmlFor="feedback-kind">What is this about?</label>
          <select id="feedback-kind" value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="product">Product feedback</option><option value="place">Incorrect place information</option><option value="suggestion">Suggest a place</option><option value="route">Route planning issue</option><option value="help">Something else</option>
          </select>
          <label htmlFor="feedback-message">Your note</label>
          <textarea id="feedback-message" value={message} onChange={(event) => setMessage(event.target.value)} minLength={10} maxLength={2000} rows={6} placeholder="Tell us what happened or what you would like us to know…" required />
          <label htmlFor="feedback-email">Email (optional)</label>
          <input id="feedback-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" />
          <button className="site-button site-button-primary" type="submit">Save feedback draft</button>
          {error ? <p className="site-form-error" role="alert">{error}</p> : null}
          {saved ? <p className="site-form-success" role="status">Draft saved on this device only. It has not been sent.</p> : null}
        </form>
        <aside className="help-card"><p className="kicker">Quick help</p><h2>Using RoamWise</h2><ol><li>Choose a starting point, destination, time, and interests in Plan a Walk.</li><li>Review the suggested route and edit stops in the itinerary.</li><li>Save the walk in this browser or open walking directions.</li><li>Enable location tracking only when you want progress updates.</li></ol><Link to="/plan" navigate={navigate}>Go to the planner →</Link><p className="site-small-note">{Array.isArray(feedbackItems) ? feedbackItems.length : 0} local {feedbackItems?.length === 1 ? 'draft' : 'drafts'} stored on this device.</p></aside>
      </div>
    </main>
  )
}

export function NotFoundPage({ navigate }) {
  return <main className="site-main not-found-page"><span className="not-found-number">404</span><p className="kicker">Wrong turn?</p><h2>We can’t find this page.</h2><p>The address may have changed, or this page may not exist.</p><div><Link className="site-button site-button-primary" to="/" navigate={navigate}>Back to RoamWise</Link><Link className="site-button site-button-secondary" to="/plan" navigate={navigate}>Plan a walk</Link></div></main>
}

export function SiteFooter({ navigate }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-brand"><strong>RoamWise</strong><p>Explore Bengaluru, not just navigate it.</p><span>Independent walking guide · Local-first by design</span></div>
      <nav aria-label="Footer"><Link to="/explore" navigate={navigate}>Explore</Link><Link to="/plan" navigate={navigate}>Plan a Walk</Link><Link to="/experiences" navigate={navigate}>Experiences</Link><Link to="/trips" navigate={navigate}>My Trips</Link><Link to="/about" navigate={navigate}>About</Link><Link to="/feedback" navigate={navigate}>Feedback & Help</Link></nav>
      <p className="site-footer-note">Place information and travel times can change. Check details with venues and route providers before setting out.</p>
    </footer>
  )
}
