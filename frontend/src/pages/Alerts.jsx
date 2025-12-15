import { useEffect, useMemo, useState } from 'react'
import { getAlerts } from '../services/api'
import { formatTimestamp } from '../utils/formatters'

const severityColors = {
  critical: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800',
  high: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-200 border border-orange-200 dark:border-orange-800',
  medium: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800',
  low: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800',
}

const AlertBadge = ({ severity }) => (
  <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${severityColors[severity] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800'}`}>
    {severity}
  </span>
)

const Alerts = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [severity, setSeverity] = useState('all')

  // Load alerts with optional severity filter
  const fetchAlerts = async () => {
    setLoading(true)
    setError(null)
    try {
      // Severity filter is passed straight through to the API
      const params = severity !== 'all' ? { severity } : {}
      const res = await getAlerts(params)
      setAlerts(res?.data?.data || res?.data || [])
    } catch (err) {
      setError('Unable to load alerts right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [severity])

  const grouped = useMemo(() => {
    // Bucket alerts by severity for grouped rendering
    return alerts.reduce((acc, alert) => {
      const level = alert.severity || 'unknown'
      acc[level] = acc[level] || []
      acc[level].push(alert)
      return acc
    }, {})
  }, [alerts])

  const levels = ['critical', 'high', 'medium', 'low']

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Alerts center</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Active alerts grouped by severity</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Drill into critical, high, medium, or low priority signals.</p>
        <div className="flex flex-wrap gap-2 pt-2">
          {['all', ...levels].map((level) => {
            const active = severity === level
            return (
              <button
                key={level}
                onClick={() => setSeverity(level)}
                // Pills drive the severity filter on the API
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                  active
                    ? 'bg-pulse-primary text-white border-pulse-primary'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            )
          })}
          <button
            onClick={fetchAlerts}
            className="ml-auto px-4 py-2 rounded-xl bg-pulse-primary text-white font-semibold hover:bg-pulse-secondary transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-200 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm">{error}</p>
          <button onClick={fetchAlerts} className="text-sm font-semibold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="h-16 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        /* Render grouped stacks in severity order */
        <div className="grid gap-4">
          {levels.map((level) => {
            const levelAlerts = grouped[level] || []
            if (levelAlerts.length === 0) return null
            return (
              <section key={level} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertBadge severity={level} />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{levelAlerts.length} alert(s)</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {levelAlerts.map((alert) => (
                    <div key={alert.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-pulse-light transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{alert.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(alert.timestamp)}</p>
                          {alert.asset && <p className="text-xs text-gray-500 dark:text-gray-400">Asset: {alert.asset}</p>}
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
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Alerts
