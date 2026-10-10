# RoamWise

RoamWise is a Bengaluru walking companion. Plan a route, discover curated places along it, compare an explore walk with the shortest walk, and browse all areas represented in the local place guide.

## Run locally

```sh
npm install
npm run dev
```

Use `npm run build` to create a production build and `npm run lint` to run Oxlint.

## Current data and account limits

- The place guide is a hand-curated sample, not a complete directory of every Bengaluru neighbourhood. Area browsing only includes areas represented in `src/data/places.json`.
- Entry-fee notes identify venues that are ticketed, but rates can change; confirm current prices with the venue.
- Profiles, reviews, and helpful votes are stored in the current browser only. There is no server authentication, account sync, or shared social feed.
- Google reviews open on Google Maps; displaying Google review content inside RoamWise requires a configured Google Places API integration and credentials.
- Walking navigation opens Google Maps directions. With browser location permission, RoamWise can track arrival at planned stops and collect post-visit feedback.
- Live crowd levels, safety predictions, and shade detection are not provided because no live data source is connected.
- Place links open a Google Maps search for the recommended location.
# RoamWise
