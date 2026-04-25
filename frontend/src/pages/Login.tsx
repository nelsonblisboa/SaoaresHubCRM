import React, { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'

const Login: React.FC = () => {
  const { showSuccess, showError } = useToast()
  const theme = useThemeClasses()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      showError('Preencha todos os campos')
      return
    }
    // Simulação de login
    showSuccess('Login realizado com sucesso!')
  }

  return (
    <div className={`${theme.bgMain} flex items-center justify-center min-h-screen p-4 font-sans`}>
      <div className="w-full max-w-[420px] space-y-8">
        <div className="text-center space-y-2">
          <h1 className={`text-4xl font-black ${theme.textPrimary} tracking-tighter uppercase italic`}>
            SOARES HUB
          </h1>
          <p className={`${theme.textMuted} text-sm`}>Gerenciamento inteligente de relacionamentos.</p>
        </div>
        
        <div className={`${theme.bgCard} ${theme.border} p-10 rounded-3xl backdrop-blur-xl shadow-2xl`}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className={`text-xs font-bold ${theme.textMuted} uppercase ml-1`}>
                E-mail Corporativo
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                className={`w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl ${theme.textPrimary} outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600`}
              />
            </div>
            
            <div className="space-y-1">
              <label className={`text-xs font-bold ${theme.textMuted} uppercase ml-1`}>
                Senha
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl ${theme.textPrimary} outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600`}
              />
            </div>
            
            <button 
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-4 rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-500/20"
            >
              Acessar Plataforma
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="text-center">
              <a href="#" className={`text-xs ${theme.textMuted} hover:text-emerald-400 transition-colors`}>
                Esqueceu sua senha?
              </a>
            </div>
          </form>
        </div>
        
        <div className="text-center text-[10px] text-slate-600 uppercase tracking-widest">
          © 2024 Soares Hub • Design by Google Stitch
        </div>
      </div>
    </div>
  )
}

export default Login
