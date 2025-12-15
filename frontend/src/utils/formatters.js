// Lightweight number formatting helpers reused across pages
export const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  // Keep large values tight while showing cents on smaller ones
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100000 ? 0 : 2
  }).format(value)
}

// Render percents with a leading plus when applicable
export const formatPercent = (value, { showPlus = true } = {}) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const formatted = value.toFixed(2)
  const prefix = value > 0 && showPlus ? '+' : ''
  return `${prefix}${formatted}%`
}

// Shorten large numbers (volume/market cap)
export const formatCompactNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)
}

// Friendly timestamp for cards/feed items
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '—'
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}
