import { INTERESTS } from '../lib/discover'

const INTEREST_ICONS = {
  food: '🍴',
  heritage: '🏛',
  park: '🌿',
  culture: '🎭',
  architecture: '⌂',
  market: '🧺',
}

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
  const presetBudgets = [30, 60, 90, 120, 180]
  const isPresetBudget = presetBudgets.includes(budgetMinutes)

  return (
    <section className="panel planner">
      <div className="kicker">Journey planner</div>
      <h2>Plan a walk</h2>
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

      <details className="planner-options">
        <summary>More options</summary>
        <div className="row-2">
          <div className="field">
            <label htmlFor="time">Start time</label>
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
              value={isPresetBudget ? budgetMinutes : 'custom'}
              onChange={(e) => onChange({
                budgetMinutes: e.target.value === 'custom'
                  ? (isPresetBudget ? 150 : budgetMinutes)
                  : Number(e.target.value),
              })}
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
              <option value="custom">Custom time…</option>
            </select>
            {!isPresetBudget ? (
              <input
                className="custom-budget-input"
                aria-label="Custom time budget in minutes"
                type="number"
                min="30"
                max="720"
                step="15"
                value={budgetMinutes}
                onChange={(e) => onChange({ budgetMinutes: Math.min(720, Math.max(30, Number(e.target.value) || 30)) })}
              />
            ) : null}
          </div>
        </div>

        <div className="field">
          <label htmlFor="pace">Walking pace</label>
          <select id="pace" value={pace} onChange={(e) => onChange({ pace: e.target.value })}>
            <option value="leisurely">Leisurely</option>
            <option value="steady">Steady</option>
            <option value="brisk">Brisk</option>
          </select>
        </div>

        <div className="field planner-interest-field">
          <span className="planner-option-label">Interests</span>
          <div className="interests">
            {INTERESTS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`chip ${interests.includes(item.id) ? 'active' : ''}`}
                aria-pressed={interests.includes(item.id)}
                onClick={() => onToggleInterest(item.id)}
              >
                <span className="chip-icon" aria-hidden="true">{INTEREST_ICONS[item.id]}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </details>
      <button
        className="plan-btn"
        type="button"
        onClick={onPlan}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? <span className="loading-spinner" aria-hidden="true" /> : null}
        {loading ? 'Planning your walk…' : 'Plan walk'}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </section>
  )
}
