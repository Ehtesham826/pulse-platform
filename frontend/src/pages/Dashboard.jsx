import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getAllAssets, getDashboard, getPortfolio } from '../services/api'
import { formatCurrency, formatPercent, formatTimestamp } from '../utils/formatters'
import { computePortfolioTrend } from '../utils/portfolio'

const ChangeBadge = ({ value }) => {
  const isNumeric = typeof value === 'number' && !Number.isNaN(value)
  const isPositive = isNumeric && value > 0
  const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold'
  const tone = !isNumeric
    ? 'bg-gray-100 text-gray-700'
    : isPositive
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-700'
  const arrow = !isNumeric ? '•' : isPositive ? '▲' : '▼'
  return (
    <span className={`${base} ${tone}`}>
      {arrow} {isNumeric ? formatPercent(value) : '—'}
    </span>
  )
}

const SeverityBadge = ({ severity = 'medium' }) => {
  const map = {
    critical: 'bg-rose-100 text-rose-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-emerald-100 text-emerald-700'
  }
  const tone = map[severity] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${tone}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  )
}

const SectionTitle = ({ title, subtitle }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
    <div className="h-1 w-16 bg-gradient-to-r from-pulse-primary to-pulse-secondary rounded-full" />
  </div>
)

const SkeletonCard = ({ lines = 3 }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4" />
    {[...Array(lines)].map((_, idx) => (
      <div key={idx} className="h-3 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
    ))}
  </div>
)

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [assets, setAssets] = useState([])
  const [portfolioTrend, setPortfolioTrend] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashboardRes, portfolioRes, assetsRes] = await Promise.all([
        getDashboard(),
        getPortfolio(),
        getAllAssets()
      ])
      setDashboardData(dashboardRes?.data?.data || dashboardRes?.data)
      setPortfolio(portfolioRes?.data?.data || portfolioRes?.data)
      setAssets(assetsRes?.data?.data || assetsRes?.data || [])
    } catch (err) {
      setError('Unable to load dashboard right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!portfolio) return
    const trend = computePortfolioTrend(portfolio, assets)
    setPortfolioTrend(trend)
  }, [portfolio, assets])

  const topGainers = useMemo(
    () => (dashboardData?.topGainers || []).slice(0, 3),
    [dashboardData]
  )
  const topLosers = useMemo(
    () => (dashboardData?.topLosers || []).slice(0, 3),
    [dashboardData]
  )
  const recentNews = useMemo(
    () => (dashboardData?.recentNews || []).slice(0, 5),
    [dashboardData]
  )
  const activeAlerts = useMemo(
    () => (dashboardData?.activeAlerts || []).slice(0, 5),
    [dashboardData]
  )

  const portfolioChangeClass =
    (portfolio?.totalChange ?? 0) >= 0
      ? 'text-green-600 bg-green-50 dark:text-emerald-200 dark:bg-emerald-900/40'
      : 'text-red-600 bg-red-50 dark:text-rose-200 dark:bg-rose-900/40'

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pulse-dark via-pulse-primary to-pulse-secondary text-white shadow-xl">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,white,transparent_30%)]" />
        <div className="relative grid gap-8 md:grid-cols-2 p-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-wide text-white/70">Pulse Overview</p>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">Market heartbeat at a glance</h1>
            <p className="text-white/80">
              Monitor your portfolio, spot momentum, and track the latest signals across stocks and crypto in one place.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="px-3 py-1 rounded-full bg-white/15 text-sm">Live mock data</span>
              <span className="px-3 py-1 rounded-full bg-white/15 text-sm">API powered</span>
              <span className="px-3 py-1 rounded-full bg-white/15 text-sm">Real-time ready</span>
            </div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm shadow-inner">
            <p className="text-sm text-white/70 mb-3">Quick pulse</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <p className="text-xs text-white/70">Top gainer</p>
                <p className="text-lg font-semibold">{topGainers[0]?.symbol || '—'}</p>
                <p className="text-sm text-emerald-100">
                  {topGainers[0]?.changePercent ? formatPercent(topGainers[0].changePercent) : '—'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <p className="text-xs text-white/70">Top loser</p>
                <p className="text-lg font-semibold">{topLosers[0]?.symbol || '—'}</p>
                <p className="text-sm text-rose-100">
                  {topLosers[0]?.changePercent ? formatPercent(topLosers[0].changePercent) : '—'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 col-span-2">
                <p className="text-xs text-white/70 mb-1">Active alerts tracked</p>
                <p className="text-2xl font-bold">
                  {dashboardData?.activeAlerts?.length ? dashboardData.activeAlerts.length : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 h-full">
                <SectionTitle title="Portfolio summary" subtitle="Synced from /api/portfolio" />
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total value</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(portfolio?.totalValue)}</p>
                    </div>
                    <div className={`px-3 py-2 rounded-xl text-sm font-semibold ${portfolioChangeClass}`}>
                      <div>{formatCurrency(portfolio?.totalChange)}</div>
                      <div className="text-xs">{formatPercent(portfolio?.totalChangePercent || 0)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {portfolio?.assets?.slice(0, 3).map((asset) => (
                      <div key={asset.assetId} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-800 dark:text-gray-100">{asset.assetId}</p>
                          <ChangeBadge value={asset.changePercent} />
                        </div>
                        <p className="text-gray-500 dark:text-gray-300 mt-1">{formatCurrency(asset.value)}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Qty {asset.quantity} @ {formatCurrency(asset.avgBuyPrice)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                    Live mock data refreshed every 30s
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 h-full">
                <SectionTitle title="Portfolio value trend" subtitle="Built from asset price history" />
                <div className="h-64">
                  {portfolioTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={portfolioTrend}>
                        <defs>
                          <linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          stroke="#9ca3af"
                        />
                        <YAxis
                          tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                          stroke="#9ca3af"
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-sm">
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{formatTimestamp(label)}</p>
                                <p className="text-pulse-primary font-bold">{formatCurrency(payload[0].value)}</p>
                              </div>
                            )
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#6366f1"
                          fill="url(#pulseFill)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full grid place-items-center text-sm text-gray-500">Chart will appear once data loads.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="grid gap-6 md:grid-cols-2 h-full">
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
                  <SectionTitle title="Top gainers" subtitle="Across stocks & crypto" />
                  <div className="space-y-3">
                    {topGainers.map((asset) => (
                      <div key={asset.id || asset.symbol} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{asset.symbol}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{asset.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900 dark:text-gray-100 font-semibold">{formatCurrency(asset.currentPrice)}</p>
                          <span className="text-emerald-600 text-sm font-semibold">{formatPercent(asset.changePercent)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
                  <SectionTitle title="Top losers" subtitle="Across stocks & crypto" />
                  <div className="space-y-3">
                    {topLosers.map((asset) => (
                      <div key={asset.id || asset.symbol} className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-900/40 border border-rose-100 dark:border-rose-800">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{asset.symbol}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{asset.name}</p>
                        </div>
                          <div className="text-right">
                          <p className="text-gray-900 dark:text-gray-100 font-semibold">{formatCurrency(asset.currentPrice)}</p>
                          <span className="text-rose-600 text-sm font-semibold">{formatPercent(asset.changePercent)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
              <SectionTitle title="Recent news" subtitle="Latest 5 updates" />
              <div className="space-y-4">
                {recentNews.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800">
                    <div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-pulse-light text-pulse-dark capitalize">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.source}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{formatTimestamp(item.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
              <SectionTitle title="Active alerts" subtitle="Latest 5 alerts" />
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-pulse-light transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{alert.message}</p>
                          <SeverityBadge severity={alert.severity} />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(alert.timestamp)}</p>
                      </div>
                      {alert.impact && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 capitalize">
                          {alert.impact} impact
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
              <SectionTitle title="AI Core insights" subtitle="Pattern recognition & anomalies" />
              <div className="space-y-3">
                {(dashboardData?.aiInsights || []).map((insight) => (
                  <div key={insight.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{insight.title}</p>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-pulse-light text-pulse-dark">
                        {Math.round(insight.confidence * 100)}% conf
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span className="uppercase tracking-wide">{insight.asset}</span>
                      <span>{formatTimestamp(insight.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
              <SectionTitle title="Upcoming events" subtitle="Stay ahead of catalysts" />
              <div className="space-y-3">
                {(dashboardData?.upcomingEvents || []).slice(0, 5).map((event) => (
                  <div key={event.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-pulse-light transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{event.title}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                        {event.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-between">
                      <span>{formatTimestamp(event.scheduledTime)}</span>
                      {event.predictedOutcome && (
                        <span className="font-semibold text-pulse-primary">
                          {event.predictedOutcome}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
