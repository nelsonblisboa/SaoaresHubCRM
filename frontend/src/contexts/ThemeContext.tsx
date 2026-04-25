import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
  isDarkMode: boolean
  accentColor: string
  isHighContrast: boolean
  toggleTheme: () => void
  setAccentColor: (color: string) => void
  toggleHighContrast: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Carregar preferências do localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('crm-theme-dark')
    return saved ? JSON.parse(saved) : true
  })
  
  const [accentColor, setAccentColorState] = useState(() => {
    return localStorage.getItem('crm-accent-color') || '#10b981'
  })
  
  const [isHighContrast, setIsHighContrast] = useState(() => {
    const saved = localStorage.getItem('crm-high-contrast')
    return saved ? JSON.parse(saved) : false
  })

  // Salvar no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('crm-theme-dark', JSON.stringify(isDarkMode))
    localStorage.setItem('crm-accent-color', accentColor)
    localStorage.setItem('crm-high-contrast', JSON.stringify(isHighContrast))
    
    // Aplicar tema ao documento
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
    
    // Aplicar cor de destaque via CSS custom property
    document.documentElement.style.setProperty('--accent-color', accentColor)
  }, [isDarkMode, accentColor, isHighContrast])

  const toggleTheme = () => setIsDarkMode(prev => !prev)
  
  const setAccentColor = (color: string) => setAccentColorState(color)
  
  const toggleHighContrast = () => setIsHighContrast(prev => !prev)

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      accentColor,
      isHighContrast,
      toggleTheme,
      setAccentColor,
      toggleHighContrast
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeContext
