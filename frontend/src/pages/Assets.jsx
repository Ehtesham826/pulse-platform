import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getCrypto, getStocks } from '../services/api'
import { formatCompactNumber, formatCurrency, formatPercent, formatTimestamp } from '../utils/formatters'

const ChangePill = ({ value }) => {
  const isNumeric = typeof value === 'number' && !Number.isNaN(value)
  const isPositive = isNumeric && value > 0
  const tone = !isNumeric
    ? 'bg-gray-100 text-gray-700'
    : isPositive
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    : 'bg-rose-50 text-rose-700 border border-rose-100'
  const arrow = !isNumeric ? '•' : isPositive ? '▲' : '▼'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${tone}`}>
      {arrow} {isNumeric ? formatPercent(value) : '—'}
    </span>
  )
}

const AssetTypeBadge = ({ type }) => {
  const map = {
    stock: 'bg-blue-50 text-blue-700 border border-blue-100',
    crypto: 'bg-purple-50 text-purple-700 border border-purple-100'
  }
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${map[type] || 'bg-gray-100 text-gray-700'}`}>
      {type}
    </span>
  )
}

const SortSelect = ({ value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pulse-primary/30"
  >
    <option value="change-desc">Change % (High → Low)</option>
    <option value="price-desc">Price (High → Low)</option>
    <option value="price-asc">Price (Low → High)</option>
    <option value="volume-desc">Volume (High → Low)</option>
    <option value="symbol">Symbol A → Z</option>
  </select>
)

  // Simple detail modal with a tiny price chart
  const AssetModal = ({ asset, onClose }) => {
    if (!asset) return null
    const history = asset.priceHistory || []
    return (
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold"
          aria-label="Close modal"
        >
          ×
        </button>
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{asset.assetType}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{asset.symbol}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{asset.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Current price</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(asset.currentPrice)}</p>
              <div className="mt-2">
                <ChangePill value={asset.changePercent} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Market cap</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCompactNumber(asset.marketCap)}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Volume</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCompactNumber(asset.volume)}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Change</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(asset.changeAmount)}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Last updated</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{formatTimestamp(history[history.length - 1]?.timestamp)}</p>
            </div>
          </div>
          <div className="h-64">
            {history.length > 0 ? (
              // Quick sparkline using the mock price history
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="assetFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    stroke="#9ca3af"
                  />
                  <YAxis stroke="#9ca3af" tickFormatter={(v) => `$${v.toFixed(0)}`} />
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
                  <Area type="monotone" dataKey="price" stroke="#8b5cf6" fill="url(#assetFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-sm text-gray-500">No history available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const Assets = () => {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('change-desc')
  const [search, setSearch] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)

  const fetchAssets = async () => {
    setLoading(true)
    setError(null)
    try {
      // Pull both universes then tag them with a type for filtering
      const [stocksRes, cryptoRes] = await Promise.all([getStocks(), getCrypto()])
      const stocks = (stocksRes?.data?.data || stocksRes?.data || []).map((s) => ({
        ...s,
        assetType: 'stock'
      }))
      const crypto = (cryptoRes?.data?.data || cryptoRes?.data || []).map((c) => ({
        ...c,
        assetType: 'crypto'
      }))
      setAssets([...stocks, ...crypto])
    } catch (err) {
      setError('Unable to load assets right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  const filteredAssets = useMemo(() => {
    let list = [...assets]
    // Apply type filter and text search
    if (filter !== 'all') {
      list = list.filter((a) => a.assetType === filter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (a) =>
          a.symbol?.toLowerCase().includes(q) ||
          a.name?.toLowerCase().includes(q)
      )
    }
    // Then order the resulting set
    const sorter = {
      'change-desc': (a, b) => (b.changePercent || 0) - (a.changePercent || 0),
      'price-desc': (a, b) => (b.currentPrice || 0) - (a.currentPrice || 0),
      'price-asc': (a, b) => (a.currentPrice || 0) - (b.currentPrice || 0),
      'volume-desc': (a, b) => (b.volume || 0) - (a.volume || 0),
      symbol: (a, b) => (a.symbol || '').localeCompare(b.symbol || '')
    }
    const sortFn = sorter[sortBy] || sorter['change-desc']
    return list.sort(sortFn)
  }, [assets, filter, search, sortBy])

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm p-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Assets universe</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Stocks & Crypto at a glance</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Filter, sort, and scan performance in one table.</p>
          </div>
          <div className="flex items-center gap-2 bg-pulse-light text-pulse-dark px-3 py-2 rounded-xl">
            <span className="text-xl">🧭</span>
            <span className="text-sm font-semibold">Unified watch</span>
          </div>
        </div>
        {/* Controls: filter pills, search, and sort */}
        <div className="flex flex-wrap items-center gap-3">
          {['all', 'stock', 'crypto'].map((option) => {
            const isActive = filter === option
            return (
              <button
                key={option}
                // Simple pill filters for type
                onClick={() => setFilter(option)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  isActive
                    ? 'bg-pulse-primary text-white border-pulse-primary'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {option === 'all' ? 'All assets' : option === 'stock' ? 'Stocks only' : 'Crypto only'}
              </button>
            )
          })}
          <div className="flex-1 min-w-[200px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by symbol or name..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-pulse-primary/30"
            />
          </div>
          <SortSelect value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={fetchAssets}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="animate-pulse bg-white border border-gray-100 rounded-2xl h-16" />
          ))}
        </div>
      ) : (
        <>
          {/* Desktop table view */}
          <div className="hidden md:block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/70">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Asset</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Change</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Volume</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredAssets.map((asset) => (
                  <tr
                    key={`${asset.assetType}-${asset.symbol}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{asset.symbol}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(asset.currentPrice)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChangePill value={asset.changePercent} />
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {formatCompactNumber(asset.volume)}
                    </td>
                    <td className="px-6 py-4">
                      <AssetTypeBadge type={asset.assetType} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filteredAssets.map((asset) => (
              <div
                key={`${asset.assetType}-${asset.symbol}-card`}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm"
                onClick={() => setSelectedAsset(asset)}
              >
                {/* Compact card view for mobile */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{asset.symbol}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{asset.name}</p>
                  </div>
                  <AssetTypeBadge type={asset.assetType} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(asset.currentPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Change</p>
                    <ChangePill value={asset.changePercent} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Volume</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCompactNumber(asset.volume)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <AssetModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
        </>
      )}
    </div>
  )
}

export default Assets
