import { formatKm, formatMinutes } from '../lib/geo'

export default function ItineraryPanel({
  itinerary,
  cultureLine,
  source,
  budgetMinutes,
  loading,
  onFitBudget,
  onMoveStop,
  onChangeStopDuration,
  onClearStops,
  onResetRecommendations,
}) {
  return (
    <details className="section itinerary planner-disclosure" open>
      <summary className="planner-disclosure-summary">
        <span>
          <span className="kicker">Time-aware walk</span>
          <span className="planner-disclosure-title">Selected itinerary</span>
        </span>
        <span className="planner-disclosure-chevron" aria-hidden="true" />
      </summary>
      <div className="planner-disclosure-content">
        {!itinerary?.items?.length ? (
          <p className="empty">Your hour-by-hour walking plan will appear here after you chart a route.</p>
        ) : (
          <>
          <p className="culture-note">{cultureLine}</p>
          <p className="hint">
            Arrive {itinerary.endTime} · {formatMinutes(itinerary.totalMinutes)} total
            {source === 'estimate' ? ' · time and distance are estimates; no routed path available' : ' · routed path from OSRM'}
          </p>
          <div className="itinerary-summary" aria-label="Itinerary estimates">
            <span><strong>{formatKm(itinerary.totalDistance || 0)}</strong> {source === 'estimate' ? 'estimated distance' : 'route distance'}</span>
            <span><strong>{formatMinutes(itinerary.walkingMinutes || 0)}</strong> walking</span>
            <span><strong>{formatMinutes(itinerary.visitMinutes || 0)}</strong> at stops</span>
            <span>
              <strong>{itinerary.overBudgetMinutes
                ? `${formatMinutes(itinerary.overBudgetMinutes)} over`
                : `${formatMinutes(Math.max(0, itinerary.remainingMinutes ?? budgetMinutes))} left`}</strong>
              {itinerary.overBudgetMinutes ? ' time budget' : ' budget'}
            </span>
          </div>
          {itinerary.overBudgetMinutes ? (
            <p className="budget-warning" role="status">
              This edited itinerary exceeds your {budgetMinutes}-minute budget by {formatMinutes(itinerary.overBudgetMinutes)}.
              Shorten the walk or fit the itinerary to your available time.
            </p>
          ) : null}
          <button
            className="text-button fit-budget-button"
            type="button"
            onClick={onFitBudget}
            disabled={loading}
          >
            {loading ? 'Updating itinerary…' : 'Fit my available time'}
          </button>
          <div className="itinerary-controls">
            <button type="button" className="text-button" disabled={loading} onClick={onClearStops}>
              Clear optional stops
            </button>
            <button type="button" className="text-button" disabled={loading} onClick={onResetRecommendations}>
              Reset recommendations
            </button>
          </div>
          <ol className="timeline">
            {itinerary.items.map((item) => {
              const stopIndex = item.type === 'stop'
                ? itinerary.items.filter((entry) => entry.type === 'stop').findIndex((entry) => entry.id === item.id)
                : -1
              const stopCount = itinerary.items.filter((entry) => entry.type === 'stop').length
              return (
                <li key={item.id} className={`timeline-item timeline-${item.type}`}>
                  <div className="when">{item.time}</div>
                  <div className="dotcol">
                    <div className={`dot ${item.type === 'walk' ? 'walk' : ''} ${item.place?.category || ''}`}>
                      {item.type === 'stop' ? stopIndex + 1 : null}
                    </div>
                  </div>
                  <div className="timeline-copy">
                    <strong>{item.title}</strong>
                    <p className="meta">{item.subtitle}</p>
                    {item.type === 'stop' ? (
                      <>
                        <label className="sr-only" htmlFor={`stop-duration-${item.id}`}>
                          Visit duration at {item.title}
                        </label>
                        <select
                          id={`stop-duration-${item.id}`}
                          className="stop-duration-select"
                          value={item.place.visitMinutes}
                          disabled={loading}
                          onChange={(event) => onChangeStopDuration(item.id, Number(event.target.value))}
                        >
                          {[5, 10, 15, 20, 30, 45, 60, 90, 120, 180]
                            .map((duration) => (
                              <option key={duration} value={duration}>{duration} min at stop</option>
                            ))}
                          {! [5, 10, 15, 20, 30, 45, 60, 90, 120, 180].includes(item.place.visitMinutes) ? (
                            <option value={item.place.visitMinutes}>{item.place.visitMinutes} min at stop</option>
                          ) : null}
                        </select>
                        <div className="timeline-stop-actions">
                          <span className="meta">{item.remainingBudgetMinutes >= 0
                            ? `${formatMinutes(item.remainingBudgetMinutes)} remaining after stop`
                            : `${formatMinutes(Math.abs(item.remainingBudgetMinutes))} over budget after stop`}</span>
                          <button
                            type="button"
                            className="text-button"
                            aria-label={`Move ${item.title} earlier`}
                            title="Move earlier"
                            disabled={loading || stopIndex === 0}
                            onClick={() => onMoveStop(item.id, -1)}
                          >↑</button>
                          <button
                            type="button"
                            className="text-button"
                            aria-label={`Move ${item.title} later`}
                            title="Move later"
                            disabled={loading || stopIndex === stopCount - 1}
                            onClick={() => onMoveStop(item.id, 1)}
                          >↓</button>
                        </div>
                      </>
                    ) : null}
                    {item.cultureNote ? <p className="culture-note">{item.cultureNote}</p> : null}
                  </div>
                </li>
              )
            })}
          </ol>
          </>
        )}
      </div>
    </details>
  )
}
