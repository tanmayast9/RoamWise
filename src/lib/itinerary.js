import { minutesToTime, parseTimeToMinutes } from './geo'

export function buildItinerary({
  start,
  dest,
  startTime,
  stops,
  legs,
}) {
  let cursor = parseTimeToMinutes(startTime)
  const items = [
    {
      id: 'depart',
      type: 'start',
      title: `Start at ${start.name}`,
      subtitle: start.neighborhood,
      time: minutesToTime(cursor),
    },
  ]

  const points = [start, ...stops, dest]

  for (let i = 0; i < points.length - 1; i += 1) {
    const leg = legs?.[i]
    const walkMin = Math.max(1, Math.round((leg?.duration || 0) / 60) || 8)
    cursor += walkMin
    items.push({
      id: `walk-${i}`,
      type: 'walk',
      title: i === points.length - 2 ? `Walk to ${dest.name}` : `Walk toward ${points[i + 1].name}`,
      subtitle: `${walkMin} min on foot`,
      time: minutesToTime(cursor),
      minutes: walkMin,
    })

    const next = points[i + 1]
    const isEnd = i === points.length - 2
    if (!isEnd) {
      const dwell = next.visitMinutes || 20
      items.push({
        id: next.id,
        type: 'stop',
        place: next,
        title: next.name,
        subtitle: `${next.neighborhood} · ${dwell} min stop`,
        time: minutesToTime(cursor),
        minutes: dwell,
        foodTip: next.foodTip,
        cultureNote: next.cultureNote,
      })
      cursor += dwell
    }
  }

  items.push({
    id: 'arrive',
    type: 'end',
    title: `Arrive at ${dest.name}`,
    subtitle: dest.neighborhood,
    time: minutesToTime(cursor),
  })

  return {
    items,
    endMinutes: cursor,
    endTime: minutesToTime(cursor),
    totalMinutes: cursor - parseTimeToMinutes(startTime),
  }
}

export function summarizeCulture(startTime, stops) {
  const hour = Number(String(startTime).split(':')[0] || 10)
  if (hour < 11) {
    return 'Morning is filter-coffee hour. Darshinis and markets are at their best before the heat.'
  }
  if (hour < 16) {
    return 'Afternoon walks work if you stitch shade: parks, museum halls, and palace courtyards.'
  }
  if (stops.some((s) => s.category === 'food' || s.category === 'market')) {
    return 'Evening is for lit streets, chaat, and the city’s social pavements. Keep one hunger stop.'
  }
  return 'Golden hour flatters granite, lakes, and Cubbon’s rain trees. Stay out for the lighting.'
}
