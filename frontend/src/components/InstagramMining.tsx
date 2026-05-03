import React, { useState, useEffect } from 'react'
import { 
  Instagram, 
  Search, 
  Users, 
  MessageCircle,
  X,
  Play,
  Pause,
  RefreshCw,
  Check,
  AlertCircle,
  Loader,
  MapPin,
  Hash
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

interface ProspectResult {
  username: string
  full_name: string
  biography: string
  followers_count: number
  following_count: number
  is_private: boolean
  is_business: boolean
}

interface InstagramMiningProps {
  onClose: () => void
}

export const InstagramMining: React.FC<InstagramMiningProps> = ({ onClose }) => {
  const { showSuccess, showError, showInfo } = useToast()
  const theme = useThemeClasses()
  const { profile } = useAuth()

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>('idle')
  const [sessionActive, setSessionActive] = useState(false)

  const [searchTarget, setSearchTarget] = useState('')
  const [targetType, setTargetType] = useState<'hashtag' | 'location' | 'username'>('hashtag')
  const [limit, setLimit] = useState(50)

  const [results, setResults] = useState<ProspectResult[]>([])
  const [selectedProspects, setSelectedProspects] = useState<string[]>([])
  const [importing, setImporting] = useState(false)

  const [serviceUrl, setServiceUrl] = useState('http://localhost:8000')

  useEffect(() => {
    loadConfig()
    checkServiceStatus()
  }, [])

  const loadConfig = async () => {
    try {
      const { data } = await supabase
        .from('organizations')
        .select('instagram_service_url')
        .eq('id', profile?.organization_id)
        .single()

      if (data?.instagram_service_url) {
        setServiceUrl(data.instagram_service_url)
      }
    } catch (err) {
      console.error('Erro ao carregar config:', err)
    }
  }

  const checkServiceStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${serviceUrl}/health`, { signal: AbortSignal.timeout(5000) })
      const json = await res.json()
      
      if (json.status === 'ok') {
        setStatus('connected')
        setSessionActive(json.session_active || false)
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const handleProspect = async () => {
    if (!searchTarget.trim()) {
      showError('Digite um alvo para buscar')
      return
    }

    try {
      setLoading(true)
      setResults([])

      const endpoint = targetType === 'hashtag' 
        ? `${serviceUrl}/prospect/hashtag/${searchTarget}`
        : targetType === 'location'
        ? `${serviceUrl}/prospect/location/${searchTarget}`
        : `${serviceUrl}/prospect/user/${searchTarget}`

      const response = await fetch(`${endpoint}?limit=${limit}`, {
        signal: AbortSignal.timeout(120000)
      })

      if (!response.ok) throw new Error('Erro na busca')

      const data = await response.json()
      setResults(data.results || [])
      showSuccess(`${data.results?.length || 0} resultados encontrados`)
    } catch (err: any) {
      showError(err.message || 'Erro ao buscar prospects')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectProspect = (username: string) => {
    setSelectedProspects(prev => 
      prev.includes(username) 
        ? prev.filter(p => p !== username)
        : [...prev, username]
    )
  }

  const selectAll = () => {
    if (selectedProspects.length === results.length) {
      setSelectedProspects([])
    } else {
      setSelectedProspects(results.map(r => r.username))
    }
  }

  const importSelectedProspects = async () => {
    if (selectedProspects.length === 0) {
      showError('Selecione pelo menos um prospect')
      return
    }

    try {
      setImporting(true)
      let imported = 0

      for (const username of selectedProspects) {
        const prospect = results.find(r => r.username === username)
        if (!prospect) continue

        const { error } = await supabase
          .from('contacts')
          .insert({
            name: prospect.full_name || username,
            instagram_username: username,
            source: 'instagram_mining',
            tags: ['prospect', 'instagram'],
            organization_id: profile?.organization_id
          })

        if (!error) imported++
      }

      showSuccess(`${imported} prospects importados!`)
      setSelectedProspects([])
    } catch (err: any) {
      showError(err.message || 'Erro ao importar')
    } finally {
      setImporting(false)
    }
  }

  const sendDirectMessage = async (username: string, message: string) => {
    try {
      setLoading(true)
      
      const response = await fetch(`${serviceUrl}/send-dm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, message })
      })

      if (!response.ok) throw new Error('Erro ao enviar')

      showSuccess(`DM enviado para @${username}`)
    } catch (err: any) {
      showError(err.message || 'Erro ao enviar DM')
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = {
    idle: { color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'Não conectado' },
    loading: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Verificando...' },
    connected: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Conectado' },
    error: { color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Erro' }
  }

  const currentStatus = statusConfig[status]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${theme.bgCard} border ${theme.border} rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/10 rounded-xl">
              <Instagram className="text-pink-500" size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${theme.textPrimary}`}>Instagram Mining</h3>
              <p className={`text-xs ${theme.textMuted}`}>Prospecção e engajamento</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 ${theme.bgHover} rounded-lg`}>
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Status Bar */}
        <div className={`p-4 border-b ${theme.border} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className={`text-sm font-bold ${currentStatus.color}`}>{currentStatus.label}</span>
            {sessionActive && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${currentStatus.bg} ${currentStatus.color}`}>
                Sessão ativa
              </span>
            )}
          </div>
          <button
            onClick={checkServiceStatus}
            className={`p-2 ${theme.bgHover} rounded-lg text-slate-400 hover:text-white`}
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Search Section */}
        <div className={`p-6 border-b ${theme.border} ${theme.bgCardSolid}`}>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className={`text-xs ${theme.textMuted} font-bold uppercase mb-2 block`}>
                Tipo de Busca
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTargetType('hashtag')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                    targetType === 'hashtag' 
                      ? 'bg-pink-500 text-white' 
                      : `${theme.bgMain} ${theme.border} border ${theme.textMuted}`
                  }`}
                >
                  <Hash size={14} className="inline mr-1" />
                  Hashtag
                </button>
                <button
                  onClick={() => setTargetType('location')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                    targetType === 'location' 
                      ? 'bg-pink-500 text-white' 
                      : `${theme.bgMain} ${theme.border} border ${theme.textMuted}`
                  }`}
                >
                  <MapPin size={14} className="inline mr-1" />
                  Local
                </button>
                <button
                  onClick={() => setTargetType('username')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                    targetType === 'username' 
                      ? 'bg-pink-500 text-white' 
                      : `${theme.bgMain} ${theme.border} border ${theme.textMuted}`
                  }`}
                >
                  <Users size={14} className="inline mr-1" />
                  Perfil
                </button>
              </div>
            </div>
            <div className="w-32">
              <label className={`text-xs ${theme.textMuted} font-bold uppercase mb-2 block`}>
                Limite
              </label>
              <select
                value={limit}
                onChange={e => setLimit(Number(e.target.value))}
                className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-3 py-2 ${theme.textPrimary}`}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={searchTarget}
              onChange={e => setSearchTarget(e.target.value)}
              placeholder={targetType === 'hashtag' ? 'marketingdigital' : targetType === 'location' ? 'São Paulo' : 'influenciador'}
              className={`flex-1 ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} outline-none`}
              onKeyDown={e => e.key === 'Enter' && handleProspect()}
            />
            <button
              onClick={handleProspect}
              disabled={loading || status !== 'connected'}
              className="px-6 py-3 bg-pink-500 hover:bg-pink-400 disabled:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2"
            >
              {loading ? <Loader size={18} className="animate-spin" /> : <Search size={18} />}
              Buscar
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {results.length === 0 ? (
            <div className="text-center py-12">
              <Instagram size={48} className={`mx-auto mb-4 ${theme.textMuted} opacity-50`} />
              <p className={theme.textMuted}>Faça uma busca para encontrar prospects</p>
            </div>
          ) : (
            <>
              {/* Selection Header */}
              <div className="flex items-center justify-between mb-4">
                <p className={`text-sm ${theme.textMuted}`}>
                  {results.length} resultados • {selectedProspects.length} selecionados
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className={`text-xs px-3 py-1 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                  >
                    {selectedProspects.length === results.length ? 'Desmarcar Tudo' : 'Selecionar Todos'}
                  </button>
                  <button
                    onClick={importSelectedProspects}
                    disabled={selectedProspects.length === 0 || importing}
                    className="flex items-center gap-1 text-xs px-3 py-1 bg-emerald-500 text-slate-950 rounded-lg font-bold disabled:opacity-50"
                  >
                    {importing ? <Loader size={14} className="animate-spin" /> : <Users size={14} />}
                    Importar
                  </button>
                </div>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.map((prospect, idx) => (
                  <div 
                    key={idx}
                    className={`${theme.bgCardSolid} ${theme.border} border p-4 rounded-xl flex items-start gap-3 ${
                      selectedProspects.includes(prospect.username) ? 'ring-2 ring-pink-500' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProspects.includes(prospect.username)}
                      onChange={() => toggleSelectProspect(prospect.username)}
                      className="mt-1 rounded border-pink-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold ${theme.textPrimary}`}>
                        @{prospect.username}
                      </p>
                      <p className={`text-xs ${theme.textMuted} truncate`}>
                        {prospect.full_name}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>👥 {prospect.followers_count}</span>
                        <span>👤 {prospect.following_count}</span>
                        {prospect.is_private && <span>🔒</span>}
                        {prospect.is_business && <span>💼</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => sendDirectMessage(prospect.username, 'Olá! Vi seu perfil e gostaria de conversar sobre nossos serviços.')}
                      className="p-2 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30"
                      title="Enviar DM"
                    >
                      <MessageCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}