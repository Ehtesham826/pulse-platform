export const computePortfolioTrend = (portfolio, assets = []) => {
  if (!portfolio?.assets?.length || !assets?.length) return []
  const assetMap = new Map()
  assets.forEach((asset) => assetMap.set(asset.symbol, asset))

  const sampleAsset = assetMap.get(portfolio.assets[0]?.assetId)
  const length = sampleAsset?.priceHistory?.length || 0
  if (!length) return []

  const trend = []
  for (let i = 0; i < length; i++) {
    let totalValue = 0
    let timestamp = null
    portfolio.assets.forEach((holding) => {
      const asset = assetMap.get(holding.assetId)
      if (!asset?.priceHistory?.[i]) return
      const point = asset.priceHistory[i]
      timestamp = timestamp || point.timestamp
      totalValue += point.price * holding.quantity
    })
    if (timestamp) {
      trend.push({ timestamp, value: Number(totalValue.toFixed(2)) })
    }
  }

  return trend
}
