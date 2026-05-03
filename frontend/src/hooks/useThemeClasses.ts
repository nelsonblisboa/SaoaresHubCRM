import { useTheme } from '../contexts/ThemeContext'

const getColorClass = (color: string) => {
  const colorMap: Record<string, { text: string, bg: string, border: string, bgLight: string }> = {
    '#10b981': { text: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500', bgLight: 'bg-emerald-500/10' },
    '#3b82f6': { text: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500', bgLight: 'bg-blue-500/10' },
    '#8b5cf6': { text: 'text-violet-500', bg: 'bg-violet-500', border: 'border-violet-500', bgLight: 'bg-violet-500/10' },
    '#ec4899': { text: 'text-pink-500', bg: 'bg-pink-500', border: 'border-pink-500', bgLight: 'bg-pink-500/10' },
    '#f59e0b': { text: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500', bgLight: 'bg-amber-500/10' },
    '#ef4444': { text: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500', bgLight: 'bg-red-500/10' },
    '#06b6d4': { text: 'text-cyan-500', bg: 'bg-cyan-500', border: 'border-cyan-500', bgLight: 'bg-cyan-500/10' },
    '#84cc16': { text: 'text-lime-500', bg: 'bg-lime-500', border: 'border-lime-500', bgLight: 'bg-lime-500/10' },
  }
  return colorMap[color.toLowerCase()] || colorMap['#10b981']
}

export const useThemeClasses = () => {
  const { isDarkMode, accentColor } = useTheme()
  const colors = getColorClass(accentColor)

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
    
    // Cores de destaque (usam a cor selecionada)
    accent: colors.text,
    accentBg: colors.bg,
    accentBorder: colors.border,
    accentBgLight: colors.bgLight,
    
    // Cores de status (mantém originais)
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
    iconActive: colors.text,
  }

  return theme
}

export default useThemeClasses
