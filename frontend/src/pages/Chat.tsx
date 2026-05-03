/**
 * SOARES HUB CRM - Chat Page
 * Chat em tempo real com suporte a IA, Handover e arquivos
 * Latência < 5 segundos (crítico)
 */

import React, { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  UserCheck,
  AlertTriangle,
  Phone,
  MessageSquare,
  MoreVertical
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { useChat } from '../hooks/useChat'
import { MessageBubble } from '../components/MessageBubble'
import { useAuth } from '../contexts/AuthContext'

const Chat: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const theme = useThemeClasses()
  const { profile } = useAuth()
  
  const [inputMessage, setInputMessage] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  const {
    messages,
    conversation,
    loading,
    sending,
    sendMessage,
    takeOver,
    messagesEndRef,
  } = useChat(id)

  // Handler para enviar mensagem
  const handleSend = async () => {
    if (!inputMessage.trim() || sending) return
    
    const messageToSend = inputMessage.trim()
    setInputMessage('')
    
    // Focar no input
    setTimeout(() => inputRef.current?.focus(), 0)
    
    await sendMessage(messageToSend)
  }

  // Handler para Enter (sem Shift)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
            <p className={theme.textMuted}>Carregando conversa...</p>
          </div>
        </main>
      </div>
    )
  }

  // Conversa não encontrada
  if (!conversation) {
    return (
      <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare size={48} className={`mx-auto mb-4 ${theme.textMuted}`} />
            <p className={`text-lg font-bold ${theme.textPrimary} mb-2`}>
              Conversa não encontrada
            </p>
            <button
              onClick={() => navigate('/conversations')}
              className="text-emerald-500 hover:underline text-sm"
            >
              Voltar para conversas
            </button>
          </div>
        </main>
      </div>
    )
  }

  const isAiActive = conversation.isAiActive
  const status = conversation.status
  const contactName = conversation.contact?.name || 'Lead'
  const contactPhone = conversation.contact?.phoneNumber
  const contactInstagram = conversation.contact?.instagramUsername

  return (
    <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
      <Sidebar />

      <main className={`flex-1 flex flex-col ${theme.bgMain}`}>
        {/* Header da Conversa */}
        <header className={`${theme.bgCard} border-b ${theme.border} px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/conversations')}
                className={`p-2 rounded-lg ${theme.bgHover} transition-colors`}
              >
                <ArrowLeft size={20} className={theme.textMuted} />
              </button>

              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  status === 'AGUARDANDO_HUMANO' 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : isAiActive 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-slate-700 text-slate-300'
                }`}>
                  {status === 'AGUARDANDO_HUMANO' ? (
                    <AlertTriangle size={20} />
                  ) : isAiActive ? (
                    <Bot size={20} />
                  ) : (
                    <User size={20} />
                  )}
                </div>

                {/* Info do Contato */}
                <div>
                  <h2 className={`font-bold ${theme.textPrimary}`}>{contactName}</h2>
                  <div className={`flex items-center gap-3 text-xs ${theme.textMuted}`}>
                    {contactPhone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        {contactPhone}
                      </span>
                    )}
                    {contactInstagram && (
                      <span>@{contactInstagram}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      status === 'AGUARDANDO_HUMANO' 
                        ? 'bg-amber-500/20 text-amber-400' 
                        : status === 'ATIVA'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {status === 'AGUARDANDO_HUMANO' ? '⚠️ Aguardando Humano' : 
                       status === 'ATIVA' ? '✅ Ativa' : '🔒 Fechada'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              {/* Botão Assumir (apenas se IA ativa ou aguardando humano) */}
              {(isAiActive || status === 'AGUARDANDO_HUMANO') && (
                <button
                  onClick={takeOver}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  <UserCheck size={16} />
                  Assumir
                </button>
              )}

              {/* Lead Info */}
              {conversation.lead && (
                <div className={`px-3 py-1.5 rounded-xl ${theme.bgCardSolid} ${theme.border} border text-xs`}>
                  <span className={`font-bold ${
                    conversation.lead.temperature === 'QUENTE' ? 'text-orange-400' :
                    conversation.lead.temperature === 'MORNO' ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    {conversation.lead.temperature}
                  </span>
                  <span className="mx-2">|</span>
                  <span className={theme.textMuted}>
                    Score: {conversation.lead.score}/10
                  </span>
                </div>
              )}

              <button className={`p-2 rounded-lg ${theme.bgHover} transition-colors`}>
                <MoreVertical size={20} className={theme.textMuted} />
              </button>
            </div>
          </div>
        </header>

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className={theme.textMuted}>Nenhuma mensagem ainda</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLast={idx === messages.length - 1}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de Mensagem */}
        <div className={`${theme.bgCard} border-t ${theme.border} p-4`}>
          {/* Alerta de Handover */}
          {status === 'AGUARDANDO_HUMANO' && isAiActive && (
            <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
              <AlertTriangle className="text-amber-400 flex-shrink-0" size={18} />
              <p className="text-sm text-amber-400">
                <strong>IA desativada.</strong> Esta conversa está aguardando atendimento humano.
              </p>
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  status === 'AGUARDANDO_HUMANO' && !isAiActive
                    ? 'Conversa aguardando humano...'
                    : 'Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)'
                }
                disabled={sending || (status === 'AGUARDANDO_HUMANO' && !isAiActive)}
                rows={1}
                className={`w-full px-4 py-3 ${theme.bgCardSolid} ${theme.border} border rounded-2xl ${theme.textPrimary} placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none resize-none text-sm`}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim() || sending}
              className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 rounded-2xl transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Chat
