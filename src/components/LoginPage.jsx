import { useState } from 'react'

export default function LoginPage({ profile, onSave, onSignOut, onBack }) {
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [email, setEmail] = useState(profile?.email || '')

  function handleSubmit(event) {
    event.preventDefault()
    onSave({ displayName: displayName.trim(), email: email.trim().toLowerCase() })
  }

  return (
    <main className="account-page">
      <header className="nav account-nav">
        <a className="brand brand-link" href="/" onClick={(event) => { event.preventDefault(); onBack() }}>
          <div className="logo" aria-hidden="true">✦</div>
          <div>
            <h1>RoamWise</h1>
            <p className="tagline">Explore Bengaluru, not just navigate it.</p>
          </div>
        </a>
        <button className="ghost" type="button" onClick={onBack}>Back to the map</button>
      </header>

      <section className="account-card">
        <div className="kicker">Your explorer profile</div>
        <h2>{profile ? 'Welcome back' : 'Make this walk yours'}</h2>
        <p className="lede">
          Save a name to add it to your reviews and community notes.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              autoComplete="name"
              required
              maxLength={50}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="How should we credit your reviews?"
            />
          </div>
          <div className="field">
            <label htmlFor="profile-email">Email</label>
            <input
              id="profile-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <button className="plan-btn" type="submit">
            {profile ? 'Save profile' : 'Create local profile'}
          </button>
        </form>
        {profile ? (
          <button className="signout-btn" type="button" onClick={onSignOut}>Sign out</button>
        ) : null}
        <p className="account-notice">
          Demo account only: your profile and reviews stay in this browser. There is no server
          authentication or cross-device sync, so do not use a password or sensitive information.
        </p>
      </section>
    </main>
  )
}
