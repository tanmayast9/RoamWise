# RoamWise

RoamWise is a local-first walking companion for exploring Bengaluru. Plan a route, discover
curated places along it, tune the itinerary to a time budget, and keep a private walk history in
the current browser.

## Website pages

The site uses client-side history routing; Vite serves the app shell for direct page URLs.

- `/` — Product introduction, how it works, selected experiences, and curated places.
- `/explore` — Searchable, filterable place directory with a synchronized map.
- `/plan` — A focused start/destination planner, optional route settings, editable itinerary, route
  comparison, and walking controls.
- `/experiences` — Preview curated walks and load them into the planner.
- `/places/:id` — Place information, nearby guide entries, local reviews, and map actions.
- `/trips` — Save the current plan, manage saved/recent walks, favourites, completed walks, and
  browse curated walk packs.
- `/passport` — My RoamWise visit history, earned exploration badges, private travel journal, and
  practical information about estimates and locally stored data.
- `/about` and `/feedback` — Product information, usage help, and a local-only feedback draft form.
- Unknown routes show a branded not-found page. Main and footer navigation remain available across
  the public pages; the planner keeps its focused full-screen map layout.

## Implemented features

- **Journey planning:** Choose start and destination landmarks, with optional start time, walking
  pace, 30/60/90/120/180-minute or custom time budget, and interests.
- **Quick Walk and Explore:** Compare the direct routed option with a route through selected stops.
  Nearby places are ranked using interest match, time of day, route proximity, and estimated
  stop/detour time.
- **Time-aware itinerary:** Review estimated walking and visit time, route distance, remaining time,
  and over-budget warnings. Fit the recommended stops to the selected budget, reorder stops, edit
  visit duration, clear optional stops, or restore recommendations.
- **Curated discovery:** Filter nearby places by category, select map markers, add stops, save
  favourites, and open extra place notes with entry information and approximate route distance.
- **Themed walk packs:** Preview and load themed walks assembled only from records in the existing
  curated Bengaluru dataset. Pack distance/time are rough estimates until routing is attempted.
- **Saved walks and recap:** Save, load/resume, update from the current planner, and delete
  itineraries from My Trips. Mark stops visited or skipped, review a remaining planned
  time/distance estimate, replan from a known browser location, write private journal notes for
  completed walks, and share a walk recap without profile information.
- **Walk Passport:** Local completion statistics and achievements are derived from completed walk
  records; achievements are not awarded from merely opening a pack or saving a walk.
- **Navigation and reviews:** Google Maps walking directions, optional foreground browser-location
  tracking, arrival feedback, locally stored reviews and helpful votes, and links to Google Maps
  reviews.
- **Responsive dashboard:** Collapsible planner, map-first layout, compact navigation and summary
  overlay, and a horizontal nearby-discovery carousel.
- **Connected website:** Responsive primary/footer navigation, direct place URLs, page-specific
  document titles and descriptions, a home page, Explore map/list, curated experience previews,
  place detail views, trip/passport pages, About, feedback/help, and a branded not-found state.
- **Explore controls:** Search, category, area, estimated visit-duration, and name/visit-time sorting
  are based on fields present in the curated place data.
- **Local feedback drafts:** The validated form stores a draft in this browser and clearly reports
  that it has not been sent to a service.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Validation commands:

```sh
npm run lint
npm test
npm run build
```

## Data, estimates, and integrations

- Places and landmarks are hand-curated in
  [`src/data/places.json`](./src/data/places.json) and [`src/data/landmarks.json`](./src/data/landmarks.json).
  The place set covers a limited number of Bengaluru areas, not the whole city.
- OSRM is used as the current routing service. When it fails, the app does **not** draw an invented
  straight-line route. It shows an explicitly labeled rough distance/time estimate and uses the
  direct line only as a discovery-search approximation.
- Suggested detour and stop durations are estimates. A routed Explore itinerary uses route-provider
  leg data where available. Walking conditions, closures, and the user's actual pace can differ.
- Some venues may charge admission, but current ticket prices, restaurant prices, hours, dietary
  guarantees, and live ratings are not available in the dataset. Unknown values are not treated as
  zero; confirm details with the venue. The quick-stop food filter uses estimated visit times;
  dietary, cuisine, and price filters remain disabled until venue data is verified.
- Accessibility data and route accessibility are not verified in the current dataset. Ask the
  venue and check the route before travel.
- No weather provider, public-essentials dataset, Google Places API, backend, or external account
  service is configured. Google reviews open on Google Maps; RoamWise does not import or reproduce
  them.
- Profiles, saved walks, favorites, walk progress, journal notes, reviews, and feedback are stored
  only in the current browser. They do not sync between users or devices. Corrupt or unavailable
  local storage falls back to an in-memory default and is reported to the browser console.
- Location tracking requires browser permission and a secure context. It runs only while tracking
  is enabled in the open page. Google Maps provides turn-by-turn guidance; RoamWise does not offer
  background or spoken navigation.

## Current limitations

The existing place records do not contain verified dietary/budget tags, hidden-gem classifications,
source citations, translations, accessibility attributes, opening hours, or cost ranges. The app
therefore does not fabricate these filters or claims. The themed packs are curated selections from
the existing data, not live recommendations. Weather-aware planning, nearby essentials, multilingual
phrase support, and numeric total-cost estimates require trustworthy data providers before they can
be implemented responsibly.
