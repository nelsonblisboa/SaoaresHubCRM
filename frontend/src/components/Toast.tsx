import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useThemeClasses } from '../hooks/useThemeClasses'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  message: string
  type: ToastType
  duration?: number
  onClose: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 5000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false)
  const theme = useThemeClasses()

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onClose(id), 300)
  }

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return `${theme.successBg} border-emerald-500/30 ${theme.success}`
      case 'error':
        return `${theme.errorBg} border-rose-500/30 ${theme.error}`
      case 'warning':
        return `${theme.warningBg} border-amber-500/30 ${theme.warning}`
      case 'info':
        return `${theme.infoBg} border-blue-500/30 ${theme.info}`
      default:
        return ''
    }
  }

  const Icon = icons[type]

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg min-w-[320px] max-w-[480px] transform transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      } ${getStyles()}`}
    >
      <Icon size={20} className="flex-shrink-0" />
      <p className={`flex-1 text-sm font-medium ${theme.textSecondary}`}>{message}</p>
      <button
        onClick={handleClose}
        className={`p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0`}
      >
        <X size={16} className={`${theme.iconMuted} hover:text-emerald-500`} />
      </button>
    </div>
  )
}

export default Toast
