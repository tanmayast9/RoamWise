export default function ItineraryPanel({ itinerary, cultureLine, source }) {
  return (
    <section className="section itinerary">
      <div className="kicker">Time-aware walk</div>
      <h3>Selected itinerary</h3>
      {!itinerary?.items?.length ? (
        <p className="empty">Your hour-by-hour walking plan will appear here after you chart a route.</p>
      ) : (
        <>
          <p className="culture-note">{cultureLine}</p>
          <p className="hint">
            Arrive {itinerary.endTime} · {itinerary.totalMinutes} min total
            {source === 'estimate' ? ' · estimated path (routing service busy)' : ' · OSRM walking path'}
          </p>
          <ol className="timeline">
            {itinerary.items.map((item) => (
              <li key={item.id}>
                <div className="when">{item.time}</div>
                <div className="dotcol">
                  <div className={`dot ${item.type === 'walk' ? 'walk' : ''}`} />
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <p className="meta">{item.subtitle}</p>
                  {item.cultureNote ? <p className="culture-note">{item.cultureNote}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
