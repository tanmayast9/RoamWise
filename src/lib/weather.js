export async function getWalkWeather(provider, request) {
  if (provider === null || provider === undefined) {
    return {
      status: 'unavailable',
      message: 'No weather provider is configured; check a local forecast before departure.',
    }
  }
  if (typeof provider !== 'function') {
    throw new TypeError('The weather provider must be a function.')
  }

  const result = await provider(request)
  if (!result || typeof result !== 'object') {
    throw new Error('The weather provider returned an invalid forecast.')
  }
  if (typeof result.observedAt !== 'string' || Number.isNaN(Date.parse(result.observedAt))) {
    throw new Error('The weather provider response must include a valid observedAt timestamp.')
  }
  if (typeof result.summary !== 'string' || !result.summary.trim()) {
    throw new Error('The weather provider response must include a forecast summary.')
  }

  return {
    status: 'available',
    observedAt: result.observedAt,
    summary: result.summary,
    precipitationProbability: Number.isFinite(result.precipitationProbability)
      ? Math.min(100, Math.max(0, result.precipitationProbability))
      : null,
    source: typeof result.source === 'string' ? result.source : 'Configured weather provider',
  }
}
