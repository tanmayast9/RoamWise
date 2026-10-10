export default function Navbar({ profile, onProfileClick }) {
  return (
    <header className="nav">
      <div className="brand">
        <div className="logo" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 5l2.2 6.4 6.7.2-5.3 4.1 2 6.5L16 18.6 8.4 22.2l2-6.5-5.3-4.1 6.7-.2L16 5z"
              fill="#F7F1E8"
            />
            <circle cx="16" cy="16" r="3" fill="#E07A3D" />
          </svg>
        </div>
        <div>
          <h1>RoamWise</h1>
          <p className="tagline">Explore Bengaluru, not just navigate it.</p>
        </div>
      </div>
      <div className="nav-actions">
        <div className="nav-chip">Walking companion · Karnataka</div>
        <button className="account-button" type="button" onClick={onProfileClick}>
          {profile ? profile.displayName : 'Sign in'}
        </button>
      </div>
    </header>
  )
}
