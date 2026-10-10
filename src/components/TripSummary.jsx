import { isTicketedPlace } from '../lib/placeInfo'

export default function TripSummary({ places }) {
  const ticketedPlaces = places.filter(isTicketedPlace)
  const foodStops = places.filter((place) => place.category === 'food')
  const foodTips = places
    .filter((place) => place.foodTip)
    .map((place) => ({ id: place.id, name: place.name, tip: place.foodTip }))
    .slice(0, 4)

  return (
    <section className="trip-summary">
      <div className="kicker">Your walk</div>
      <h3>Trip summary</h3>
      <div className="summary-stats">
        <div className="summary-stat">
          <strong>{places.length}</strong>
          <span>{places.length === 1 ? 'place selected' : 'places selected'}</span>
        </div>
        <div className="summary-stat">
          <strong>{foodStops.length}</strong>
          <span>{foodStops.length === 1 ? 'food stop' : 'food stops'}</span>
        </div>
      </div>
      <div className="summary-fees">
        <span>Total entry fees</span>
        <strong>{ticketedPlaces.length ? 'Check venue' : 'No ticket price listed'}</strong>
        <p>
          {ticketedPlaces.length
            ? `${ticketedPlaces.map((place) => place.name).join(', ')} ${
                ticketedPlaces.length === 1 ? 'may require a ticket' : 'may require tickets'
              }; current prices are not in the guide.`
            : 'No selected stop has a ticket price in the guide; confirm venue details before you go.'}
        </p>
      </div>
      <div className="summary-food">
        <h4>Things to eat</h4>
        {foodTips.length ? (
          <ul>
            {foodTips.map((item) => (
              <li key={item.id}>
                <strong>{item.name}:</strong> {item.tip}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Add itinerary stops to see local food tips.</p>
        )}
      </div>
    </section>
  )
}
