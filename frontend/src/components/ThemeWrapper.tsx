import React, { useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDarkMode, accentColor, isHighContrast } = useTheme()

  useEffect(() => {
    // Aplicar classe de tema no html e body
    const root = document.documentElement
    const body = document.body
    
    if (isDarkMode) {
      root.classList.add('dark')
      root.classList.remove('light')
      body.classList.add('dark')
      body.classList.remove('light')
      body.style.backgroundColor = '#0f172a' // slate-900
      body.style.color = '#e2e8f0' // slate-200
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
      body.classList.add('light')
      body.classList.remove('dark')
      body.style.backgroundColor = '#f3f4f6' // gray-100
      body.style.color = '#111827' // gray-900
    }

    // Aplicar cor de destaque
    root.style.setProperty('--accent-color', accentColor)
    
    // Aplicar alto contraste
    if (isHighContrast) {
      body.classList.add('high-contrast')
    } else {
      body.classList.remove('high-contrast')
    }
  }, [isDarkMode, accentColor, isHighContrast])

  return <>{children}</>
}

export default ThemeWrapper
