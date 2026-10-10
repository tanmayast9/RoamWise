import { INTERESTS } from '../lib/discover'

export default function JourneyPlanner({
  landmarks,
  startId,
  destId,
  startTime,
  budgetMinutes,
  pace,
  interests,
  loading,
  error,
  onChange,
  onToggleInterest,
  onPlan,
}) {
  return (
    <section className="panel planner">
      <div className="kicker">Journey planner</div>
      <h2>Walk with curiosity</h2>
      <p className="lede">
        Pick two points in Bengaluru. RoamWise builds a walking path, then weaves in food, parks,
        heritage, and neighbourhood culture that actually sit along the way.
      </p>

      <div className="field">
        <label htmlFor="start">Starting point</label>
        <select id="start" value={startId} onChange={(e) => onChange({ startId: e.target.value })}>
          {landmarks.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="dest">Destination</label>
        <select id="dest" value={destId} onChange={(e) => onChange({ destId: e.target.value })}>
          {landmarks.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </select>
      </div>

      <div className="row-2">
        <div className="field">
          <label htmlFor="time">Start walking</label>
          <input
            id="time"
            type="time"
            value={startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="budget">Time budget</label>
          <select
            id="budget"
            value={budgetMinutes}
            onChange={(e) => onChange({ budgetMinutes: Number(e.target.value) })}
          >
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
            <option value={240}>Half day</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="pace">Walking pace</label>
        <select id="pace" value={pace} onChange={(e) => onChange({ pace: e.target.value })}>
          <option value="leisurely">Leisurely · linger and look</option>
          <option value="steady">Steady · city stroll</option>
          <option value="brisk">Brisk · cover more ground</option>
        </select>
      </div>

      <label className="field" style={{ marginBottom: 4 }}>
        What do you want to discover?
      </label>
      <div className="interests">
        {INTERESTS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`chip ${interests.includes(item.id) ? 'active' : ''}`}
            onClick={() => onToggleInterest(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <button className="plan-btn" type="button" onClick={onPlan} disabled={loading}>
        {loading ? 'Charting footpaths…' : 'Plan this walk'}
      </button>
      {error ? <p className="error">{error}</p> : null}
      <p className="hint">
        Compare the shortest footpath with an explore route that stops for Bengaluru — not just the
        blue line.
      </p>
    </section>
  )
}
