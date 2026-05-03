/**
 * SOARES HUB CRM — Componente: HandoverAlert
 *
 * Banner global de alta visibilidade que aparece quando a IA solicita
 * intervenção humana. Posicionado no topo da viewport para garantir
 * que o vendedor não perca nenhum alerta.
 *
 * Funcionalidades:
 *   - Lista todos os handovers PENDENTES em tempo real.
 *   - Exibe countdown visual: muda de amarelo → laranja → vermelho conforme o tempo passa.
 *   - Botão "Assumir" que atualiza banco e redireciona para o chat.
 *   - Animação de entrada suave via CSS transition.
 *   - Som de alerta na primeira aparição (se o browser permitir).
 */

import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, PhoneCall, Clock, X, Zap } from 'lucide-react'
import { useRealtimeHandovers, PendingHandover } from '../hooks/useRealtimeHandovers'
import { useToast } from '../contexts/ToastContext'

// ─── Sub-componente: Card de um único Handover ────────────────────────────────

interface HandoverCardProps {
  handover: PendingHandover
  onAssume: (handoverId: string, conversationId: string) => Promise<boolean>
}

const HandoverCard: React.FC<HandoverCardProps> = ({ handover, onAssume }) => {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [isAssuming, setIsAssuming] = React.useState(false)

  // Define a cor do badge de urgência com base no tempo de espera
  const urgencyConfig = React.useMemo(() => {
    if (handover.minutesWaiting >= 15) {
      return {
        bg: 'bg-red-500/20 border-red-500',
        badge: 'bg-red-500',
        text: 'CRÍTICO',
        pulse: true,
      }
    }
    if (handover.minutesWaiting >= 5) {
      return {
        bg: 'bg-orange-500/20 border-orange-500',
        badge: 'bg-orange-500',
        text: 'URGENTE',
        pulse: false,
      }
    }
    return {
      bg: 'bg-amber-500/20 border-amber-500',
      badge: 'bg-amber-500',
      text: 'PENDENTE',
      pulse: false,
    }
  }, [handover.minutesWaiting])

  const handleAssume = async () => {
    setIsAssuming(true)
    const success = await onAssume(handover.id, handover.conversationId)
    if (success) {
      showSuccess(`Conversa com ${handover.contactName} assumida! Você está no controle.`)
      navigate(`/chat/${handover.conversationId}`)
    } else {
      showError('Erro ao assumir conversa. Tente novamente.')
      setIsAssuming(false)
    }
  }

  const channelIcon = handover.channel === 'WHATSAPP' ? '📱' : '📸'

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${urgencyConfig.bg} transition-all duration-300`}
    >
      {/* Badge de urgência */}
      <span
        className={`${urgencyConfig.badge} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
          urgencyConfig.pulse ? 'animate-pulse' : ''
        }`}
      >
        {urgencyConfig.text}
      </span>

      {/* Canal + Nome */}
      <span className="text-sm font-medium text-white truncate">
        {channelIcon} {handover.contactName}
      </span>

      {/* Motivo truncado */}
      <span className="text-xs text-white/60 truncate hidden md:block">
        {handover.reason}
      </span>

      {/* Timer */}
      <div className="flex items-center gap-1 text-white/80 text-xs shrink-0 ml-auto">
        <Clock className="w-3 h-3" />
        <span>{handover.minutesWaiting}min</span>
      </div>

      {/* Botão Assumir */}
      <button
        onClick={handleAssume}
        disabled={isAssuming}
        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 
                   text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all 
                   duration-200 shrink-0 active:scale-95"
        title={`Assumir conversa com ${handover.contactName}`}
      >
        <PhoneCall className="w-3.5 h-3.5" />
        {isAssuming ? 'Assumindo...' : 'Assumir'}
      </button>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

const HandoverAlert: React.FC = () => {
  const { pendingHandovers, hasPending, totalPending, assumeHandover } = useRealtimeHandovers()
  const [isDismissed, setIsDismissed] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(true)
  const prevCountRef = useRef(0)
  const { showWarning } = useToast()

  // Dispara notificação de toast quando chega um NOVO handover
  useEffect(() => {
    if (totalPending > prevCountRef.current && prevCountRef.current >= 0) {
      if (totalPending > 0) {
        setIsDismissed(false) // Re-abre se estiver fechado
        setIsExpanded(true)

        // Tenta reproduzir som de alerta (requer interação do usuário no browser)
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA...')
          audio.volume = 0.3
          audio.play().catch(() => {}) // Silencia erro se autoplay for bloqueado
        } catch {}

        showWarning(
          `🚨 Nova conversa aguardando você! (${totalPending} pendente${totalPending > 1 ? 's' : ''})`,
          8000
        )
      }
    }
    prevCountRef.current = totalPending
  }, [totalPending, showWarning])

  // Não renderiza nada se não houver pendentes ou se foi dispensado
  if (!hasPending || isDismissed) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9998] shadow-lg shadow-amber-500/20"
      role="alert"
      aria-live="assertive"
      aria-label="Alertas de handover pendentes"
    >
      {/* Header do banner */}
      <div className="bg-slate-900/95 backdrop-blur-sm border-b border-amber-500/40 px-4 py-2 flex items-center gap-3">
        {/* Ícone + título */}
        <div className="flex items-center gap-2 text-amber-400">
          <Zap className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-wider">
            {totalPending} Conversa{totalPending > 1 ? 's' : ''} Aguardando Humano
          </span>
        </div>

        {/* Ações do banner */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setIsExpanded((e) => !e)}
            className="text-white/50 hover:text-white/80 text-xs px-2 py-1 rounded transition-colors"
            title={isExpanded ? 'Minimizar' : 'Expandir'}
          >
            {isExpanded ? '▲ Minimizar' : '▼ Ver alertas'}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-white/40 hover:text-white/70 transition-colors p-1 rounded"
            title="Dispensar alertas (temporariamente)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista de handovers (colapsável) */}
      {isExpanded && (
        <div className="bg-slate-900/90 backdrop-blur-sm px-4 py-2 flex flex-col gap-2 max-h-48 overflow-y-auto">
          {pendingHandovers.map((handover) => (
            <HandoverCard
              key={handover.id}
              handover={handover}
              onAssume={assumeHandover}
            />
          ))}

          {/* Aviso de SLA */}
          <div className="flex items-center gap-1.5 text-red-400/70 text-xs py-1">
            <AlertTriangle className="w-3 h-3" />
            <span>SLA crítico após 15 minutos. O Airflow notificará a gerência automaticamente.</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default HandoverAlert
