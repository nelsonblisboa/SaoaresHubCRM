/**
 * SOARES HUB CRM - MessageBubble Component
 * Bolha de mensagem com suporte a IA, status e timestamps
 */

import React from 'react'
import { CheckCheck, Bot, User, Clock } from 'lucide-react'
import { Message } from '../hooks/useChat'

interface MessageBubbleProps {
  message: Message
  isLast: boolean
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLast }) => {
  const isFromMe = message.fromMe
  const isAI = message.isAiGenerated

  // Formatar timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-4 group`}>
      {/* Avatar (apenas para mensagens recebidas) */}
      {!isFromMe && (
        <div className="flex-shrink-0 mr-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isAI ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
          }`}>
            {isAI ? <Bot size={16} /> : <User size={16} />}
          </div>
        </div>
      )}

      {/* Bolha da mensagem */}
      <div className={`max-w-[70%] ${isFromMe ? 'order-1' : 'order-2'}`}>
        {/* Indicador de IA */}
        {isAI && (
          <div className="flex items-center gap-1 mb-1 px-2">
            <Bot size={12} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-medium">
              {message.agentKey || 'IA'}
            </span>
          </div>
        )}

        {/* Conteúdo da mensagem */}
        <div className={`px-4 py-3 rounded-2xl ${
          isFromMe
            ? 'bg-emerald-500 text-slate-950 rounded-br-md'
            : isAI
              ? 'bg-slate-800 border border-emerald-500/30 text-slate-100 rounded-bl-md'
              : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-md'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Footer com timestamp e status */}
        <div className={`flex items-center gap-2 mt-1 px-2 ${
          isFromMe ? 'justify-end' : 'justify-start'
        }`}>
          <span className="text-[10px] text-slate-500">
            {formatTime(message.timestamp)}
          </span>

          {/* Status de envio (apenas para mensagens enviadas) */}
          {isFromMe && (
            <span className="text-emerald-500">
              <CheckCheck size={14} className="text-emerald-500" />
            </span>
          )}

          {/* Indicador de processando (mensagem temporária) */}
          {message.id.startsWith('temp-') && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock size={10} />
              Enviando...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
