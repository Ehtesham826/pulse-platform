import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { getAllAssets, getPortfolio, getPortfolioPerformance } from '../services/api'
import { formatCurrency, formatPercent, formatTimestamp } from '../utils/formatters'
import { computePortfolioTrend } from '../utils/portfolio'

const palette = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e']

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null)
  const [performance, setPerformance] = useState(null)
  const [assets, setAssets] = useState([])
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPortfolio = async () => {
    setLoading(true)
    setError(null)
    try {
      // Pull raw portfolio, derived performance, and assets in parallel
      const [portfolioRes, perfRes, assetsRes] = await Promise.all([
        getPortfolio(),
        getPortfolioPerformance(),
        getAllAssets()
      ])
      const portfolioData = portfolioRes?.data?.data || portfolioRes?.data
      setPortfolio(portfolioData)
      setPerformance(perfRes?.data?.data || perfRes?.data)
      setAssets(assetsRes?.data?.data || assetsRes?.data || [])
      // Turn price history + holdings into a chartable curve
      const trendData = computePortfolioTrend(portfolioData, assetsRes?.data?.data || assetsRes?.data || [])
      setTrend(trendData)
    } catch (err) {
      setError('Unable to load portfolio right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const allocation = useMemo(() => {
    // Map allocation data to chart-friendly shape
    return performance?.assetAllocation?.map((item, idx) => ({
      name: item.assetId,
      value: Number(item.percentage.toFixed(2)),
      color: palette[idx % palette.length]
    })) || []
  }, [performance])

  const holdings = portfolio?.assets || []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Portfolio</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Performance & allocation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Breakdown of holdings, best/worst performers, and allocation.</p>
        </div>
        <button
          onClick={fetchPortfolio}
          className="px-4 py-2 rounded-xl bg-pulse-primary text-white font-semibold hover:bg-pulse-secondary transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-200 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm">{error}</p>
          <button onClick={fetchPortfolio} className="text-sm font-semibold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-48 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total value</p>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(portfolio?.totalValue)}</h2>
                  <p className={`mt-2 text-sm font-semibold ${portfolio?.totalChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(portfolio?.totalChange)} ({formatPercent(portfolio?.totalChangePercent || 0)})
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                  <p>User: {portfolio?.userId}</p>
                  <p>Last refresh: {formatTimestamp(new Date().toISOString())}</p>
                </div>
              </div>
              <div className="h-64">
                {trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      {/* Portfolio value over time reconstructed from holdings */}
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} stroke="#9ca3af" />
                      <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} stroke="#9ca3af" />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-sm">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{formatTimestamp(label)}</p>
                              <p className="text-emerald-600 font-bold">{formatCurrency(payload[0].value)}</p>
                            </div>
                          )
                        }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#22c55e" fill="url(#portfolioFill)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full grid place-items-center text-sm text-gray-500">Trend will display once history loads.</div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Allocation</h2>
              <div className="h-64">
                {allocation.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        /* Pie slice colors come from the palette above */
                        data={allocation}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {allocation.map((entry, index) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value}%`, name]}
                        contentStyle={{ background: '#fff', borderRadius: '0.75rem' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full grid place-items-center text-sm text-gray-500">Allocation pending.</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Best performer</h3>
              {/* Quick callout for top mover */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{performance?.bestPerformer?.assetId}</p>
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">{formatPercent(performance?.bestPerformer?.changePercent || 0)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current price: {formatCurrency(performance?.bestPerformer?.currentPrice)}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Worst performer</h3>
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/40 border border-rose-100 dark:border-rose-800">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{performance?.worstPerformer?.assetId}</p>
                  <span className="text-sm font-semibold text-rose-700 dark:text-rose-200">{formatPercent(performance?.worstPerformer?.changePercent || 0)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current price: {formatCurrency(performance?.worstPerformer?.currentPrice)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Holdings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Assets in your portfolio</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                {holdings.length} positions
              </span>
            </div>
            <div className="overflow-x-auto">
              {/* Wide table lists each position with current value */}
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800/70">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Asset</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Avg Buy</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Value</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Change %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {holdings.map((asset) => (
                    <tr key={asset.assetId} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{asset.assetId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{asset.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(asset.avgBuyPrice)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(asset.value)}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        <span className={asset.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {formatPercent(asset.changePercent)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Watchlist</h3>
            <div className="flex flex-wrap gap-2">
              {portfolio?.watchlist?.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Portfolio
