import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = window.localStorage.getItem('pulse-theme')
    return saved || 'light'
  })

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    window.localStorage.setItem('pulse-theme', theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
