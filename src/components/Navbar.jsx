import { useState } from 'react'

export default function Navbar({ profile, pathname = '/', navigate = () => {}, onProfileClick }) {
  const [menuState, setMenuState] = useState({ pathname, open: false })
  const menuOpen = menuState.pathname === pathname && menuState.open
  const links = [
    ['Home', '/'],
    ['Explore', '/explore'],
    ['Plan a Walk', '/plan'],
    ['Experiences', '/experiences'],
    ['My Trips', '/trips'],
    ['My RoamWise', '/passport'],
  ]
  const activePath = pathname.startsWith('/places/') ? '/explore' : pathname

  function navigateTo(event, path) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    setMenuState({ pathname: path, open: false })
    navigate(path)
  }

  return (
    <header className="nav">
      <div className="nav-main">
        <a className="brand" href="/" onClick={(event) => navigateTo(event, '/')}>
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
        </a>
        <button
          className="mobile-nav-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuState({ pathname, open: !menuOpen })}
        >
          <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
          <span>{menuOpen ? 'Close' : 'Menu'}</span>
        </button>
        <nav id="primary-navigation" className={`site-nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          {links.map(([label, path]) => (
            <a
              href={path}
              key={path}
              className={activePath === path ? 'is-active' : ''}
              aria-current={activePath === path ? 'page' : undefined}
              onClick={(event) => navigateTo(event, path)}
            >
              {label}
            </a>
          ))}
          <a className="site-nav-cta" href="/plan" onClick={(event) => navigateTo(event, '/plan')}>Start exploring <span aria-hidden="true">→</span></a>
        </nav>
      </div>
      <div className="nav-actions">
        <span className="nav-chip">Bengaluru · Karnataka</span>
        <button className="account-button" type="button" onClick={onProfileClick} aria-label="Open local profile">
          {profile ? profile.displayName : 'Local profile'}
        </button>
      </div>
    </header>
  )
}
