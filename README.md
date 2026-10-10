# RoamWise

RoamWise is a walking companion for exploring Bengaluru. Plan a route, find curated places along
the way, compare the shortest route with a more exploratory walk, and review your planned stops.

## Features

- **Journey planner:** Choose start and destination landmarks, start time, walking pace, time
  budget, and interests.
- **Walking routes:** Compare the shortest walking route with an explore route that includes
  selected stops. Routes use OSRM when available and fall back to a distance estimate.
- **Nearby discoveries:** Browse curated food, heritage, parks, architecture, culture, and market
  places along a route. Select a place to focus its map marker or add/remove it from the itinerary.
- **Bengaluru area guide:** Search and filter the curated place list by area, view entry-fee notes,
  and open locations in Google Maps.
- **Trip summary:** See the selected-stop count, food-stop count, food recommendations, and any
  ticketed stops whose fees should be confirmed with the venue.
- **Walking navigation:** Open walking directions in Google Maps. With browser location
  permission, RoamWise can track progress, detect arrival near planned stops, and prompt for
  feedback. Stops can also be marked visited manually.
- **Reviews and sharing:** Add local ratings and reviews, mark reviews helpful, share places, and
  open Google Maps to read Google reviews.
- **Responsive layout:** Planner, itinerary, map, navigation, discoveries, and area guide adapt to
  smaller screens.
- **Map-first dashboard:** A collapsible planner and itinerary sidebar sits beside a full-height
  desktop map. Numbered category markers, floating route controls, and a swipeable nearby-place
  carousel keep the map and its discoveries together.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build` and run Oxlint with `npm run lint`.

## Data and integrations

- Places are hand-curated in [`src/data/places.json`](./src/data/places.json). The guide currently
  covers a limited set of Bengaluru areas; it is not a complete city directory.
- Entry-fee notes indicate when a venue may be ticketed, but current ticket prices are not
  available in the data. Confirm rates and opening details with the venue.
- Google reviews open in Google Maps. Displaying Google review content inside RoamWise requires a
  Google Places API integration, credentials, and compliance with Google's terms.
- Profiles, RoamWise reviews, helpful votes, and feedback are stored in the current browser only.
  There is no server authentication, shared review feed, or cross-device account sync.
- Location tracking requires browser permission and an appropriate secure context. Google Maps is
  responsible for turn-by-turn navigation; RoamWise does not provide spoken or background
  turn-by-turn guidance.
- Live crowd levels, safety predictions, and shade detection are not available because no data
  sources for those features are connected.
