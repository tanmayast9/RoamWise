import { formatKm, formatMinutes } from '../lib/geo'

export default function RouteCompare({
  shortest,
  explore,
  extraStops,
  visibleRoute,
  onChangeRoute,
}) {
  if (!shortest) return null

  const extraWalk = explore ? Math.max(0, explore.duration - shortest.duration) / 60 : 0
  const extraDist = explore ? Math.max(0, explore.distance - shortest.distance) : 0
  const estimated = shortest.source === 'estimate' || explore?.source === 'estimate'

  return (
    <div className="compare">
      <div className="compare-card">
        <h3>{estimated ? 'Route estimates' : 'Shortest vs explore'}</h3>
        <div className="stats">
          <div className="stat">
            <b>{formatKm(shortest.distance)}</b>
            <span>{estimated ? 'Direct estimate' : 'Quick walk'}</span>
          </div>
          <div className="stat">
            <b>{explore ? formatKm(explore.distance) : '—'}</b>
            <span>{estimated ? 'Explore estimate' : 'Explore route'}</span>
          </div>
          <div className="stat">
            <b>{extraStops} stops</b>
            <span>+{formatMinutes(extraWalk)} · {formatKm(extraDist)}</span>
          </div>
        </div>
        <div className="mode-toggle">
          <button
            type="button"
            className={visibleRoute === 'shortest' ? 'on-short' : ''}
            onClick={() => onChangeRoute('shortest')}
          >
            Shortest
          </button>
          <button
            type="button"
            className={visibleRoute === 'explore' ? 'on-explore' : ''}
            onClick={() => onChangeRoute('explore')}
          >
            Explore
          </button>
        </div>
        <p className="legend">
          <span>
            <i className="swatch explore" /> Explore
          </span>
          <span>
            <i className="swatch short" /> Shortest
          </span>
        </p>
        {estimated ? (
          <p className="route-estimate-note" role="status">
            No routed path is available. These are rough distance/time estimates only; no straight-line route is drawn.
          </p>
        ) : null}
      </div>
    </div>
  )
}
