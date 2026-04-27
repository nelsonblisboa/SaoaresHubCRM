import { useTheme } from '../contexts/ThemeContext'

export const useThemeClasses = () => {
  const { isDarkMode } = useTheme()

  const theme = {
    // Backgrounds
    bgPrimary: isDarkMode ? 'bg-slate-950' : 'bg-gray-100',
    bgMain: isDarkMode ? 'bg-slate-950' : 'bg-gray-100',
    bgCard: isDarkMode ? 'bg-slate-900/50' : 'bg-white',
    cardBg: isDarkMode ? 'bg-slate-900/50' : 'bg-white',
    bgCardSolid: isDarkMode ? 'bg-slate-900' : 'bg-white',
    bgHover: isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-100',
    bgTertiary: isDarkMode ? 'bg-slate-800/30' : 'bg-gray-100',
    bgInput: isDarkMode ? 'bg-slate-800/50' : 'bg-gray-100',
    bgSidebar: isDarkMode ? 'bg-slate-900/50' : 'bg-white',
    bgButton: isDarkMode ? 'bg-slate-800' : 'bg-gray-200',
    
    // Textos
    textPrimary: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-slate-200' : 'text-gray-700',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-gray-500',
    textPlaceholder: isDarkMode ? 'placeholder:text-slate-600' : 'placeholder:text-gray-400',
    
    // Bordas
    border: isDarkMode ? 'border-slate-800' : 'border-gray-200',
    borderLight: isDarkMode ? 'border-slate-700' : 'border-gray-300',
    borderHover: isDarkMode ? 'hover:border-slate-700' : 'hover:border-gray-300',
    
    // Cores de status
    success: isDarkMode ? 'text-emerald-500' : 'text-emerald-600',
    successBg: isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-100',
    error: isDarkMode ? 'text-rose-500' : 'text-red-600',
    errorBg: isDarkMode ? 'bg-rose-500/10' : 'bg-red-100',
    warning: isDarkMode ? 'text-amber-500' : 'text-amber-600',
    warningBg: isDarkMode ? 'bg-amber-500/10' : 'bg-amber-100',
    info: isDarkMode ? 'text-blue-400' : 'text-blue-600',
    infoBg: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100',
    
    // Elementos específicos
    sidebarBorder: isDarkMode ? 'border-r-slate-800' : 'border-r-gray-200',
    headerBorder: isDarkMode ? 'border-b-slate-800' : 'border-b-gray-200',
    tableBorder: isDarkMode ? 'border-slate-800' : 'border-gray-200',
    divider: isDarkMode ? 'divide-slate-800' : 'divide-gray-200',
    
    // Modais
    modalBg: isDarkMode ? 'bg-slate-900' : 'bg-white',
    modalOverlay: isDarkMode ? 'bg-black/60' : 'bg-black/40',
    
    // Inputs
    inputBg: isDarkMode ? 'bg-slate-800' : 'bg-gray-100',
    inputBorder: isDarkMode ? 'border-slate-700' : 'border-gray-300',
    inputText: isDarkMode ? 'text-slate-200' : 'text-gray-900',
    
    
    // Ícones
    iconMuted: isDarkMode ? 'text-slate-500' : 'text-gray-400',
    iconActive: isDarkMode ? 'text-emerald-500' : 'text-emerald-600',
  }

  return theme
}

export default useThemeClasses
