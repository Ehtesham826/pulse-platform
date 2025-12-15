import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import MetaMaskButton from './MetaMaskButton'
import { useTheme } from '../context/ThemeContext'

const Layout = ({ children }) => {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 768
  })
  const { theme, toggleTheme } = useTheme()
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false

  const navigation = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Assets', path: '/assets', icon: '💰' },
    { name: 'News', path: '/news', icon: '📰' },
    { name: 'Alerts', path: '/alerts', icon: '🔔' },
    { name: 'Portfolio', path: '/portfolio', icon: '💼' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen((s) => !s)}
                className="md:hidden w-10 h-10 inline-flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              >
                ☰
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-pulse-primary">Pulse</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-pulse-light text-pulse-dark font-semibold">Live</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Market Monitoring Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-semibold flex items-center gap-2 hover:border-pulse-primary/50 transition-colors"
                title="Toggle theme"
              >
                {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
              <MetaMaskButton />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:sticky top-16 md:top-16 left-0 h-[calc(100vh-4rem)] md:max-h-[calc(100vh-4rem)] w-64 bg-white/90 dark:bg-gray-900/80 backdrop-blur border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 z-30 md:translate-x-0 md:self-start md:overflow-y-auto`}
        >
          <nav className="p-4 overflow-y-auto h-full">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-pulse-primary text-white shadow-sm'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/80'
                      }`}
                      onClick={() => setSidebarOpen(!isMobile)}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black/40 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
