import { useMemo, useState } from 'react'
import { categoryLabel } from '../lib/discover'
import { entryFee, googleMapsUrl } from '../lib/placeInfo'

export default function AreaExplorer({ places, onSelectPlace }) {
  const [area, setArea] = useState('all')
  const [search, setSearch] = useState('')

  const areas = useMemo(
    () => [...new Set(places.map((place) => place.neighborhood))].sort((a, b) => a.localeCompare(b)),
    [places],
  )
  const filteredPlaces = useMemo(() => {
    const query = search.trim().toLowerCase()
    return places.filter((place) => {
      const matchesArea = area === 'all' || place.neighborhood === area
      const matchesSearch =
        !query ||
        `${place.name} ${place.neighborhood} ${place.category}`.toLowerCase().includes(query)
      return matchesArea && matchesSearch
    })
  }, [places, area, search])

  return (
    <section className="area-explorer">
      <div className="area-heading">
        <div>
          <div className="kicker">Keep exploring</div>
          <h2>Bengaluru area guide</h2>
          <p className="lede">
            Browse {areas.length} areas represented in our curated place guide. Choose a place to
            open its location in Google Maps.
          </p>
        </div>
        <span className="area-count">{filteredPlaces.length} places</span>
      </div>
      <div className="area-filters">
        <label className="area-select-label" htmlFor="area-filter">Area</label>
        <select id="area-filter" value={area} onChange={(event) => setArea(event.target.value)}>
          <option value="all">All curated areas ({areas.length})</option>
          {areas.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="place-search">Search places and areas</label>
        <input
          id="place-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search a place or area"
        />
      </div>
      <div className="area-grid">
        {filteredPlaces.map((place) => (
          <article className="area-place" key={place.id}>
            <span className="cat">{categoryLabel(place.category)}</span>
            <h3>{place.name}</h3>
            <p className="meta">{place.neighborhood}</p>
            <p className="fee-note"><strong>Entry:</strong> {entryFee(place)}</p>
            <div className="area-place-actions">
              <button className="text-button" type="button" onClick={() => onSelectPlace(place.id)}>
                Select on map
              </button>
              <a className="area-map-link" href={googleMapsUrl(place)} target="_blank" rel="noreferrer">
                Google Maps ↗
              </a>
            </div>
          </article>
        ))}
        {!filteredPlaces.length ? <p className="empty">No places match that search.</p> : null}
      </div>
      <p className="coverage-note">
        This is a growing, hand-curated guide, not a complete directory of every Bengaluru
        neighbourhood. Entry charges and opening details can change; confirm ticketed rates with
        the venue. Live crowd levels, safety predictions, and shade data are not available here.
      </p>
    </section>
  )
}
