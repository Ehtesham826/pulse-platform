import { useEffect, useMemo, useState } from 'react'
import { getNews } from '../services/api'
import { formatTimestamp } from '../utils/formatters'

const categories = ['all', 'macro', 'technology', 'crypto', 'earnings', 'regulatory', 'market']

const News = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  const fetchNews = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (category !== 'all') params.category = category
      if (search.trim()) params.search = search.trim()
      const res = await getNews(params)
      setItems(res?.data?.data || res?.data || [])
    } catch (err) {
      setError('Unable to load news right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Refetch whenever filters change
    fetchNews()
  }, [category, search])

  const visibleNews = useMemo(() => {
    // Always show most recent first
    const list = [...items].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    return list
  }, [items])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">News radar</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Market stories & catalysts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Filter by category or search across headlines.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {categories.map((cat) => {
            const active = category === cat
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                // Category chips toggle API filter
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                  active
                    ? 'bg-pulse-primary text-white border-pulse-primary'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            )
          })}
          <div className="flex-1 min-w-[200px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search headline or source..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-pulse-primary/30"
            />
          </div>
          <button
            onClick={fetchNews}
            className="px-4 py-2 rounded-xl bg-pulse-primary text-white font-semibold hover:bg-pulse-secondary transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-200 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm">{error}</p>
          <button onClick={fetchNews} className="text-sm font-semibold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="h-20 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {visibleNews.map((item) => (
            <article
              key={item.id}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:border-pulse-light transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-2 items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-pulse-light text-pulse-dark capitalize">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.summary || item.source}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(item.timestamp)}</p>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.source}</span>
              </div>
              {item.affectedAssets && item.affectedAssets.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Affected:</span>
                  {item.affectedAssets.map((asset) => (
                    <span key={asset} className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                      {asset}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default News
