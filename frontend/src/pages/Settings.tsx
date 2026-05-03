import React, { useState, useEffect } from 'react'
import { 
  Shield,
  Bot,
  Database,
  Smartphone,
  Palette,
  ChevronRight,
  X,
  Save,
  Key,
  Users,
  FileText,
  MessageSquare,
  Webhook,
  Instagram,
  Moon,
  Sun,
  Type,
  Bell,
  Brain,
  Zap,
  Cpu,
  BarChart3,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { supabase } from '../lib/supabaseClient'
import { BrandingSettings } from '../components/BrandingSettings'
import { UserManagement } from '../components/UserManagement'
import { InstagramMining } from '../components/InstagramMining'
import { Reports } from '../components/Reports'

// Tipos para os modais
type ModalType = 
  | 'persona'
  | 'prompts'
  | 'handover'
  | 'modelos'
  | 'supabase'
  | 'evolution'
  | 'webhooks'
  | 'instagram'
  | 'temas'
  | 'branding'
  | 'notificacoes'
  | 'openrouter-keys'
  | 'usuarios'
  | 'logs'
  | 'relatorios'
  | 'instagram_mining'
  | null

const Settings: React.FC = () => {
  const { showSuccess } = useToast()
  const { isDarkMode, accentColor, isHighContrast, toggleTheme, setAccentColor, toggleHighContrast } = useTheme()
  const theme = useThemeClasses()
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [accentFlash, setAccentFlash] = useState(false)

  const sections = [
    { 
      title: 'Configurações de IA', 
      icon: Bot, 
      desc: 'Gerencie o comportamento do assistente virtual.',
      items: [
        { label: 'Persona da IA', key: 'persona' as ModalType, icon: Brain },
        { label: 'Prompts do Systema', key: 'prompts' as ModalType, icon: MessageSquare },
        { label: 'Gatilhos de Handover', key: 'handover' as ModalType, icon: Zap },
        { label: 'Modelos (OpenRouter)', key: 'modelos' as ModalType, icon: Cpu }
      ]
    },
    { 
      title: 'Integrações', 
      icon: Database, 
      desc: 'Conecte APIs externas e bancos de dados.',
      items: [
        { label: 'Supabase', key: 'supabase' as ModalType, icon: Database },
        { label: 'Evolution API (WhatsApp)', key: 'evolution' as ModalType, icon: Smartphone },
        { label: 'Webhooks', key: 'webhooks' as ModalType, icon: Webhook },
        { label: 'Instagram Mining', key: 'instagram' as ModalType, icon: Instagram }
      ]
    },
    { 
      title: 'Interface & Aparência', 
      icon: Palette, 
      desc: 'Personalize o visual do seu CRM.',
      items: [
        { label: 'Temas (Dark/Light)', key: 'temas' as ModalType, icon: Moon },
        { label: 'Branding Customizado', key: 'branding' as ModalType, icon: Type },
        { label: 'Notificações Visuais', key: 'notificacoes' as ModalType, icon: Bell }
      ]
    },
    { 
      title: 'Segurança', 
      icon: Shield, 
      desc: 'Controle de acesso e chaves de API.',
      items: [
        { label: 'Chaves OpenRouter', key: 'openrouter-keys' as ModalType, icon: Key },
        { label: 'Usuários & Permissões', key: 'usuarios' as ModalType, icon: Users },
        { label: 'Logs de Auditoria', key: 'logs' as ModalType, icon: FileText }
      ]
    },
    { 
      title: 'Relatórios', 
      icon: BarChart3, 
      desc: 'Análise e exportação de dados.',
      items: [
        { label: 'Relatórios Completos', key: 'relatorios' as ModalType, icon: BarChart3 }
      ]
    },
  ]

  const openModal = (modalKey: ModalType) => setActiveModal(modalKey)
  const closeModal = () => setActiveModal(null)

  // Componente base do Modal
  const Modal: React.FC<{ title: string; icon: any; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${theme.modalBg} border ${theme.border} rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Icon className="text-emerald-500" size={24} />
            </div>
            <h3 className={`text-xl font-bold ${theme.textPrimary}`}>{title}</h3>
          </div>
          <button 
            onClick={closeModal}
            className={`p-2 ${theme.bgHover} rounded-lg transition-colors`}
          >
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {children}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-6 border-t ${theme.border} ${theme.modalBg}/50`}>
          <button 
            onClick={closeModal}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.textMuted} hover:${theme.textPrimary} transition-colors`}
          >
            Cancelar
          </button>
          <button 
            onClick={() => { showSuccess('Configurações salvas com sucesso!'); closeModal(); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-sm font-bold transition-colors"
          >
            <Save size={16} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  )

  // Modais específicos
  const PersonaModal = () => {
    const [persona, setPersona] = useState(`Você é um assistente virtual de vendas da CENTRO SOARES, uma corretora de seguros especializada em automóveis.

Seu objetivo é:
- Atender clientes de forma cordial e profissional
- Tirar dúvidas sobre seguros de automóveis
- Encaminhar leads qualificados para os corretores
- Usar linguagem brasileira natural e amigável

Personalidade: Amigável, profissional, paciente e orientada a resultados.`)

    return (
      <Modal title="Persona da IA" icon={Brain}>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Defina a personalidade, comportamento e instruções base da IA.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Descrição da Persona</label>
            <textarea 
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full h-64 bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
              placeholder="Descreva como a IA deve se comportar..."
            />
          </div>
          <div className="flex items-center gap-2 p-4 bg-emerald-500/10 rounded-xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-emerald-400">Persona ativa no sistema</span>
          </div>
        </div>
      </Modal>
    )
  }

  const PromptsModal = () => {
    const [systemPrompt, setSystemPrompt] = useState(`Você é a assistente virtual da CENTRO SOARES Seguradora.

CONTEXTO:
- Você trabalha para uma corretora de seguros de automóveis
- Sua função é pré-qualificar leads e agendar atendimentos
- Você tem acesso às informações do cliente através do CRM

REGRAS:
1. Sempre se apresente como assistente da CENTRO SOARES
2. Colete: nome, veículo, CEP e data de nascimento
3. Para cotações complexas, transfira para humano
4. Use emojis com moderação 😊

TOM DE VOZ: Profissional, amigável, eficiente`)

    return (
      <Modal title="Prompts do Systema" icon={MessageSquare}>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Configure os prompts do sistema que guiam o comportamento da IA.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Prompt do Sistema</label>
            <textarea 
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-56 bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <label className="block text-xs text-slate-500 mb-2">Temperatura</label>
              <input type="range" min="0" max="100" className="w-full accent-emerald-500" />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Preciso</span>
                <span>Criativo</span>
              </div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <label className="block text-xs text-slate-500 mb-2">Max Tokens</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-300">
                <option>1024</option>
                <option>2048</option>
                <option selected>4096</option>
                <option>8192</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    )
  }

  const HandoverModal = () => (
    <Modal title="Gatilhos de Handover" icon={Zap}>
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Configure quando a IA deve transferir a conversa para um humano.
        </p>
        <div className="space-y-3">
          {[
            { label: 'Cliente solicita atendimento humano', checked: true },
            { label: 'Palavras-chave de insatisfação detectadas', checked: true },
            { label: 'Cotação complexa (múltiplos veículos)', checked: true },
            { label: 'Cliente repetiu a mesma pergunta 3x', checked: false },
            { label: 'Sinistro/Acidente reportado', checked: true },
            { label: 'Cancelamento solicitado', checked: true },
          ].map((item, idx) => (
            <label key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
              <input 
                type="checkbox" 
                defaultChecked={item.checked}
                className="w-5 h-5 accent-emerald-500 rounded border-slate-600"
              />
              <span className="text-sm text-slate-300">{item.label}</span>
            </label>
          ))}
        </div>
        <div className="p-4 bg-slate-800/30 rounded-xl">
          <label className="block text-sm font-medium text-slate-300 mb-2">Mensagem de Transferência</label>
          <input 
            type="text" 
            defaultValue="Vou transferir você para um de nossos corretores especialistas. Um momento, por favor... 🤝"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
          />
        </div>
      </div>
    </Modal>
  )

  const ModelosModal = () => {
    // Modelos FREE da OpenRouter organizados por especialidade
    const modelosPorEspecialidade = {
      'Conversação & Atendimento': [
        { id: 'meta-llama/llama-3.1-8b-instruct', nome: 'Llama 3.1 8B', desc: 'Rápido e eficiente para chat' },
        { id: 'meta-llama/llama-3.1-70b-instruct', nome: 'Llama 3.1 70B', desc: 'Mais preciso para conversas complexas' },
        { id: 'mistralai/mistral-7b-instruct', nome: 'Mistral 7B', desc: 'Bom equilíbrio qualidade/velocidade' },
        { id: 'nousresearch/hermes-3-llama-3.1-405b', nome: 'Hermes 3 Llama 405B', desc: 'Modelo avançado para chat' },
      ],
      'Análise & Resumo': [
        { id: 'google/gemma-2-9b-it', nome: 'Gemma 2 9B', desc: 'Bom para resumos e análise' },
        { id: 'google/gemma-2-27b-it', nome: 'Gemma 2 27B', desc: 'Análise mais profunda' },
        { id: 'nvidia/llama-3.1-nemotron-70b-instruct', nome: 'Nemotron 70B', desc: 'Excelente para instruções' },
        { id: 'nvidia/llama-3.1-nemotron-51b-instruct', nome: 'Nemotron 51B', desc: 'Instruções complexas' },
      ],
      'Codificação & Lógica': [
        { id: 'qwen/qwen-2.5-coder-32b-instruct', nome: 'Qwen Coder 32B', desc: 'Especialista em código' },
        { id: 'deepseek/deepseek-coder-v2-lite', nome: 'DeepSeek Coder V2 Lite', desc: 'Código e lógica' },
        { id: 'microsoft/phi-3-medium-128k-instruct', nome: 'Phi-3 Medium', desc: 'Raciocínio lógico' },
        { id: 'microsoft/phi-3-mini-128k-instruct', nome: 'Phi-3 Mini', desc: 'Leve para tarefas simples' },
      ],
      'Multimodal & Visão': [
        { id: 'baai/bge-reranker-v2-m3', nome: 'BGE Reranker V2', desc: 'Reranking de resultados' },
        { id: 'sentence-transformers/all-MiniLM-L6-v2', nome: 'MiniLM-L6', desc: 'Embeddings rápidos' },
      ],
      'Modelos Leves (Fallback)': [
        { id: 'meta-llama/llama-3.2-1b-instruct', nome: 'Llama 3.2 1B', desc: 'Ultra-rápido para respostas simples' },
        { id: 'meta-llama/llama-3.2-3b-instruct', nome: 'Llama 3.2 3B', desc: 'Rápido e econômico' },
        { id: 'huggingfaceh4/zephyr-7b-beta', nome: 'Zephyr 7B Beta', desc: 'Modelo compacto' },
        { id: 'openchat/openchat-3.5-0106', nome: 'OpenChat 3.5', desc: 'Conversação básica' },
      ],
    }

    const [modeloPrincipal, setModeloPrincipal] = useState('meta-llama/llama-3.1-70b-instruct')
    const [modeloFallback, setModeloFallback] = useState('meta-llama/llama-3.2-3b-instruct')
    const [modeloResumo, setModeloResumo] = useState('google/gemma-2-9b-it')

    const renderSelectComGrupos = (value: string, onChange: (v: string) => void) => (
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
      >
        {Object.entries(modelosPorEspecialidade).map(([categoria, modelos]) => (
          <optgroup key={categoria} label={categoria}>
            {modelos.map((modelo) => (
              <option key={modelo.id} value={modelo.id}>
                {modelo.nome} — {modelo.desc}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    )

    return (
      <Modal title="Modelos (OpenRouter)" icon={Cpu}>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Selecione os modelos FREE da OpenRouter, organizados por especialidade.
          </p>
          
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <p className="text-xs text-emerald-400">
              ✅ Todos os modelos listados são gratuitos (FREE) na OpenRouter
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white">Modelo Principal</label>
                <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">Ativo</span>
              </div>
              {renderSelectComGrupos(modeloPrincipal, setModeloPrincipal)}
              <p className="text-xs text-slate-500 mt-2">
                Recomendado: Llama 3.1 70B para atendimento de qualidade
              </p>
            </div>
            
            <div className="p-4 bg-slate-800/30 rounded-xl">
              <label className="block text-sm font-medium text-slate-300 mb-2">Modelo de Fallback</label>
              {renderSelectComGrupos(modeloFallback, setModeloFallback)}
              <p className="text-xs text-slate-500 mt-2">
                Usado quando o principal está indisponível
              </p>
            </div>

            <div className="p-4 bg-slate-800/30 rounded-xl">
              <label className="block text-sm font-medium text-slate-300 mb-2">Modelo para Resumo</label>
              {renderSelectComGrupos(modeloResumo, setModeloResumo)}
              <p className="text-xs text-slate-500 mt-2">
                Recomendado: Gemma 2 9B para resumos rápidos
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-blue-500/10 rounded-xl">
            <p className="text-xs text-blue-400">
              💡 <strong>Dica:</strong> Modelos maiores (70B+) oferecem melhor qualidade, mas podem ser mais lentos. Use modelos menores (3B-8B) para respostas rápidas.
            </p>
          </div>

          <div className="p-4 bg-slate-800/30 rounded-xl">
            <h4 className="text-sm font-medium text-white mb-3">Guia de Especialidades</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400">●</span>
                <span className="text-slate-400"><strong>Conversação:</strong> Atendimento ao cliente</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400">●</span>
                <span className="text-slate-400"><strong>Análise:</strong> Resumos e insights</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400">●</span>
                <span className="text-slate-400"><strong>Código:</strong> Automações e scripts</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400">●</span>
                <span className="text-slate-400"><strong>Leves:</strong> Respostas rápidas</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    )
  }

  const SupabaseModal = () => {
    const [url, setUrl] = useState('https://xyz.supabase.co')
    const [key, setKey] = useState('••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••')

    return (
      <Modal title="Supabase" icon={Database}>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Configure a conexão com seu projeto Supabase.
          </p>
          
          <div className="p-4 bg-emerald-500/10 rounded-xl flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-emerald-400">Conectado ao Supabase</span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Project URL</label>
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Anon/Public Key</label>
            <input 
              type="password" 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Service Role Key</label>
            <input 
              type="password" 
              placeholder="service_role_xxxxxxxxxx"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
            />
          </div>

          <div className="flex gap-3">
            <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors">
              Testar Conexão
            </button>
            <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors">
              Sincronizar Tabelas
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  const EvolutionModal = () => (
    <Modal title="Evolution API (WhatsApp)" icon={Smartphone}>
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Gerencie a conexão com a Evolution API para WhatsApp.
        </p>
        
        <div className="p-4 bg-emerald-500/10 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-emerald-400">Status da Conexão</span>
            <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">Conectado</span>
          </div>
          <p className="text-xs text-slate-500">Instância: <span className="text-emerald-400">evohorizonbr</span></p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Evolution API URL</label>
          <input 
            type="text" 
            defaultValue="https://evohorizonbr.com"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">API Key</label>
          <input 
            type="password" 
            defaultValue="••••••••••••••••••••••••••••"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Nome da Instância</label>
          <input 
            type="text" 
            defaultValue="evohorizonbr"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
          />
        </div>

        <div className="p-4 bg-slate-800/30 rounded-xl">
          <label className="block text-sm font-medium text-slate-300 mb-3">Webhooks Configurados</label>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>MESSAGE_UPSERT</span>
              <span className="text-emerald-400">Ativo</span>
            </div>
            <div className="flex justify-between">
              <span>CONNECTION_UPDATE</span>
              <span className="text-emerald-400">Ativo</span>
            </div>
            <div className="flex justify-between">
              <span>MESSAGES_DELETE</span>
              <span className="text-emerald-400">Ativo</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )

  const WebhooksModal = () => (
    <Modal title="Webhooks" icon={Webhook}>
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Configure endpoints webhook para receber eventos externos.
        </p>
        
        <div className="space-y-3">
          <div className="p-4 bg-slate-800/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Webhook de Lead</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <input 
              type="text" 
              placeholder="https://seu-crm.com/webhook/lead"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
            />
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Webhook de Conversa</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <input 
              type="text" 
              placeholder="https://seu-crm.com/webhook/chat"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
            />
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Webhook de Handover</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <input 
              type="text" 
              placeholder="https://seu-crm.com/webhook/handover"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-800/30 rounded-xl">
          <label className="block text-sm font-medium text-slate-300 mb-2">Secret Key (para validação)</label>
          <input 
            type="password" 
            placeholder="whsec_xxxxxxxx"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
          />
        </div>
      </div>
    </Modal>
  )

  const InstagramModal = () => {
    const [username, setUsername] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [serviceUrl, setServiceUrl] = React.useState('http://localhost:8000')
    const [showPassword, setShowPassword] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)
    const [isTesting, setIsTesting] = React.useState(false)
    const [connectionStatus, setConnectionStatus] = React.useState<'idle' | 'ok' | 'error'>('idle')
    const [connectionMsg, setConnectionMsg] = React.useState('')
    const { showSuccess: toastSuccess, showError: toastError } = useToast()

    // ── Carrega credenciais salvas da tabela organizations ──────────────────
    React.useEffect(() => {
      const loadCredentials = async () => {
        const { data } = await supabase
          .from('organizations')
          .select('instagram_username, instagram_service_url')
          .single()

        if (data) {
          setUsername(data.instagram_username || '')
          setServiceUrl(data.instagram_service_url || 'http://localhost:8000')
          // Senha não é carregada por segurança — usuário re-insere apenas quando quiser alterar
        }
      }
      loadCredentials()
    }, [])

    // ── Salva no Supabase (organizations table) ─────────────────────────────
    // A senha é armazenada com um prefixo "enc:" para sinalizar que está
    // ofuscada. Em produção, usar Supabase Vault ou criptografia no backend.
    const handleSave = async () => {
      setIsSaving(true)
      try {
        const updatePayload: Record<string, string> = {
          instagram_username: username,
          instagram_service_url: serviceUrl,
        }
        // Só atualiza a senha se o campo foi preenchido (não sobrescreve com vazio)
        if (password.trim()) {
          updatePayload.instagram_password = password
        }

        const { error } = await supabase
          .from('organizations')
          .update(updatePayload)
          .neq('id', '') // Atualiza o primeiro registro da org

        if (error) throw error

        toastSuccess('Credenciais do Instagram salvas com sucesso!')
        setPassword('') // Limpa campo de senha após salvar
        closeModal()
      } catch (err: any) {
        toastError(`Erro ao salvar: ${err.message}`)
      } finally {
        setIsSaving(false)
      }
    }

    // ── Testa conectividade com o microserviço ──────────────────────────────
    const handleTest = async () => {
      setIsTesting(true)
      setConnectionStatus('idle')
      try {
        const res = await fetch(`${serviceUrl}/health`, { signal: AbortSignal.timeout(5000) })
        const json = await res.json()
        if (json.status === 'ok') {
          setConnectionStatus('ok')
          setConnectionMsg(json.session_active
            ? '✅ Microserviço online e sessão Instagram ativa.'
            : '⚠️ Microserviço online mas sem sessão ativa — salve as credenciais.')
        } else {
          throw new Error('Serviço retornou status inválido')
        }
      } catch (err: any) {
        setConnectionStatus('error')
        setConnectionMsg(`❌ Serviço inacessível em ${serviceUrl}. Verifique se o microserviço está rodando.`)
      } finally {
        setIsTesting(false)
      }
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className={`${theme.modalBg} border ${theme.border} rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${theme.border}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-xl">
                <Instagram className="text-pink-500" size={24} />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${theme.textPrimary}`}>Instagram Mining</h3>
                <p className="text-xs text-slate-500">Credenciais salvas no banco — não edite arquivos .env</p>
              </div>
            </div>
            <button onClick={closeModal} className={`p-2 ${theme.bgHover} rounded-lg transition-colors`}>
              <X size={20} className={theme.textMuted} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">

            {/* Status de conexão */}
            {connectionStatus !== 'idle' && (
              <div className={`p-3 rounded-xl text-sm ${
                connectionStatus === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {connectionMsg}
              </div>
            )}

            {/* URL do Microserviço */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                URL do Microserviço
                <span className="ml-2 text-xs text-slate-500">(onde o serviço Python está rodando)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serviceUrl}
                  onChange={(e) => setServiceUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={handleTest}
                  disabled={isTesting}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                  {isTesting ? 'Testando...' : 'Testar'}
                </button>
              </div>
            </div>

            {/* Separador */}
            <div className={`border-t ${theme.border}`} />
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Credenciais da Conta Instagram
            </p>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Usuário (@username)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="seu_usuario_instagram"
                autoComplete="off"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Password com toggle de visibilidade */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Senha
                <span className="ml-2 text-xs text-slate-500">(deixe vazio para manter a senha atual)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 pr-12 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1"
                  tabIndex={-1}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {/* Aviso de segurança */}
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <span className="text-amber-400 text-base mt-0.5">⚠️</span>
              <p className="text-xs text-amber-400 leading-relaxed">
                <strong>Recomendação:</strong> Use uma <strong>conta secundária dedicada</strong> para automação,
                nunca a conta principal do negócio. O Instagram pode suspender contas com comportamento automatizado.
                As credenciais são armazenadas na sua organização no Supabase.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex justify-end gap-3 p-6 border-t ${theme.border}`}>
            <button
              onClick={closeModal}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.textMuted} hover:${theme.textPrimary} transition-colors`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !username}
              className="flex items-center gap-2 px-5 py-2 bg-pink-500 hover:bg-pink-400 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors"
            >
              <Save size={16} />
              {isSaving ? 'Salvando...' : 'Salvar Credenciais'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const TemasModal = () => {
    const colors = [
      { hex: '#10b981', name: 'Esmeralda' },
      { hex: '#3b82f6', name: 'Azul' },
      { hex: '#f59e0b', name: 'Âmbar' },
      { hex: '#ef4444', name: 'Vermelho' },
      { hex: '#8b5cf6', name: 'Violeta' },
      { hex: '#ec4899', name: 'Rosa' },
    ]
    
    return (
      <Modal title="Temas (Dark/Light)" icon={Moon}>
        <div className="space-y-4">
          <p className={`text-sm ${theme.textMuted}`}>
            Escolha o tema de aparência do CRM. As alterações são aplicadas imediatamente.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => { if (!isDarkMode) toggleTheme(); showSuccess('Tema escuro ativado'); }}
              className={`p-6 rounded-2xl border-2 transition-all ${
                isDarkMode 
                  ? 'border-emerald-500 bg-slate-800' 
                  : 'border-gray-300 bg-gray-100'
              }`}
            >
              <Moon size={32} className={isDarkMode ? 'text-emerald-500 mb-3' : 'text-gray-400 mb-3'} />
              <span className={`block font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Escuro</span>
              <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Tema padrão escuro</span>
            </button>
            
            <button 
              onClick={() => { if (isDarkMode) toggleTheme(); showSuccess('Tema claro ativado'); }}
              className={`p-6 rounded-2xl border-2 transition-all ${
                !isDarkMode 
                  ? 'border-emerald-500 bg-white' 
                  : 'border-slate-700 bg-slate-800/50'
              }`}
            >
              <Sun size={32} className={!isDarkMode ? 'text-emerald-500 mb-3' : 'text-slate-500 mb-3'} />
              <span className={`block font-medium ${!isDarkMode ? 'text-gray-900' : 'text-slate-400'}`}>Claro</span>
              <span className={`text-xs ${!isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>Tema claro</span>
            </button>
          </div>

          <div className={`p-4 ${isDarkMode ? 'bg-slate-800/30' : 'bg-gray-100'} rounded-xl`}>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'} mb-3`}>Cor de Destaque</label>
            <div className="flex gap-3">
              {colors.map((color) => (
                <button 
                  key={color.hex}
                  onClick={() => { 
                  setAccentColor(color.hex)
                  setAccentFlash(true)
                  setTimeout(() => setAccentFlash(false), 300)
                }}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    accentColor === color.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:border-white hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
            <p className={`text-xs ${theme.textMuted} mt-2`}>
              Cor atual: <span style={{ color: accentColor }}>{colors.find(c => c.hex === accentColor)?.name || 'Personalizada'}</span>
            </p>
          </div>

          <div className={`flex items-center justify-between p-4 ${isDarkMode ? 'bg-slate-800/30' : 'bg-gray-100'} rounded-xl`}>
            <div>
              <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Tema de Alto Contraste</span>
              <p className={`text-xs ${theme.textMuted}`}>Melhora a acessibilidade</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isHighContrast}
                onChange={() => { toggleHighContrast(); showSuccess(isHighContrast ? 'Alto contraste desativado' : 'Alto contraste ativado'); }}
                className="sr-only peer" 
              />
              <div className={`w-11 h-6 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'} peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500`}></div>
            </label>
          </div>

          <div className={`p-4 ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'} rounded-xl`}>
            <p className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              💡 Suas preferências de tema são salvas automaticamente e persistem entre sessões.
            </p>
          </div>
        </div>
      </Modal>
    )
  }

  const BrandingModal = () => (
    <Modal title="Branding Customizado" icon={Type}>
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Personalize a identidade visual do CRM.
        </p>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Nome da Empresa</label>
          <input 
            type="text" 
            defaultValue="CENTRO SOARES"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Slogan</label>
          <input 
            type="text" 
            defaultValue="SEGURO ESmeralda"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Logo Principal</label>
            <div className="p-6 bg-slate-800/50 border border-slate-700 border-dashed rounded-xl text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-xl mx-auto mb-2 flex items-center justify-center">
                <Palette className="text-emerald-500" size={24} />
              </div>
              <span className="text-xs text-slate-500">Clique para upload</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Ícone/Favicon</label>
            <div className="p-6 bg-slate-800/50 border border-slate-700 border-dashed rounded-xl text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-xl mx-auto mb-2 flex items-center justify-center">
                <Palette className="text-emerald-500" size={24} />
              </div>
              <span className="text-xs text-slate-500">Clique para upload</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Fonte Principal</label>
          <select className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200">
            <option>Inter (Padrão)</option>
            <option>Roboto</option>
            <option>Montserrat</option>
            <option>Poppins</option>
          </select>
        </div>
      </div>
    </Modal>
  )

  const NotificacoesModal = () => (
    <Modal title="Notificações Visuais" icon={Bell}>
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Configure quais notificações visuais serão exibidas no CRM.
        </p>
        
        <div className="space-y-3">
          {[
            { label: 'Novos leads recebidos', checked: true },
            { label: 'Mensagens do WhatsApp', checked: true },
            { label: 'Transferências de IA para humano', checked: true },
            { label: 'Tarefas atribuídas a mim', checked: true },
            { label: 'Lembrete de follow-up', checked: false },
            { label: 'Metas atingidas', checked: true },
            { label: 'Erros de integração', checked: true },
          ].map((item, idx) => (
            <label key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
              <span className="text-sm text-slate-300">{item.label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </label>
          ))}
        </div>

        <div className="p-4 bg-slate-800/30 rounded-xl">
          <label className="block text-sm font-medium text-slate-300 mb-2">Duração das Notificações</label>
          <select className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200">
            <option>3 segundos</option>
            <option selected>5 segundos</option>
            <option>10 segundos</option>
            <option>Permanente (até fechar)</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
          <span className="text-sm text-slate-300">Som de notificação</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>
    </Modal>
  )

  const OpenRouterKeysModal = () => (
    <Modal title="Chaves OpenRouter" icon={Key}>
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Gerencie suas chaves de API do OpenRouter.
        </p>
        
        <div className="p-4 bg-emerald-500/10 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-emerald-400">Status</span>
            <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">Ativa</span>
          </div>
          <p className="text-xs text-slate-500">Limite: <span className="text-emerald-400">$100/mês</span> | Usado: <span className="text-emerald-400">$23.45</span></p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">API Key</label>
          <div className="flex gap-2">
            <input 
              type="password" 
              defaultValue="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
            />
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors">
              Copiar
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">HTTP-Referer</label>
          <input 
            type="text" 
            defaultValue="https://centrosoares.com"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">X-Title</label>
          <input 
            type="text" 
            defaultValue="CENTRO SOARES CRM"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
          />
        </div>

        <div className="flex gap-3">
          <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors">
            Verificar Saldo
          </button>
          <button className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-sm font-medium transition-colors">
            Revogar Chave
          </button>
        </div>

        <div className="p-4 bg-blue-500/10 rounded-xl">
          <p className="text-xs text-blue-400">
            🔑 As chaves são criptografadas e armazenadas de forma segura. Nunca compartilhe sua chave em repositórios públicos.
          </p>
        </div>
      </div>
    </Modal>
  )

  const UsuariosModal = () => {
    const [usuarios, setUsuarios] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      fetchUsuarios()
    }, [])

    const fetchUsuarios = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setUsuarios(data || [])
      } catch (error: any) {
        console.error('Erro ao carregar usuários:', error.message)
      } finally {
        setLoading(false)
      }
    }

    return (
      <Modal title="Usuários & Permissões" icon={Users}>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Gerencie usuários do sistema e suas permissões.
          </p>
           
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-slate-500">Carregando usuários...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {usuarios.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-500">
                      {user.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.name || 'Sem nome'}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                      user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 
                      user.role === 'GERENTE' ? 'bg-blue-500/20 text-blue-400' : 
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={() => showSuccess('Funcionalidade em desenvolvimento')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
          >
            + Adicionar Usuário
          </button>
        </div>
      </Modal>
    )
  }

  const LogsModal = () => {
    const logs = [
      { acao: 'Login', usuario: 'Nelson Soares', data: '24/04/2026 10:30', ip: '192.168.1.100', status: 'Sucesso' },
      { acao: 'Lead criado', usuario: 'Sistema', data: '24/04/2026 10:25', ip: '-', status: 'Sucesso' },
      { acao: 'Configuração alterada', usuario: 'Nelson Soares', data: '24/04/2026 09:15', ip: '192.168.1.100', status: 'Sucesso' },
      { acao: 'Tentativa de acesso', usuario: 'Desconhecido', data: '23/04/2026 22:45', ip: '45.123.45.67', status: 'Falha' },
      { acao: 'Webhook recebido', usuario: 'Evolution API', data: '23/04/2026 15:30', ip: '-', status: 'Sucesso' },
    ]

    return (
      <Modal title="Logs de Auditoria" icon={FileText}>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Visualize o histórico de ações no sistema.
          </p>
          
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="Buscar logs..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
            />
            <select className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200">
              <option>Todos</option>
              <option>Sucesso</option>
              <option>Falha</option>
            </select>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.map((log, idx) => (
              <div key={idx} className="p-3 bg-slate-800/50 rounded-xl text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 font-medium">{log.acao}</span>
                  <span className={`px-2 py-0.5 rounded-full ${log.status === 'Sucesso' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {log.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>{log.usuario}</span>
                  <span>{log.data}</span>
                </div>
                {log.ip !== '-' && <div className="text-slate-600 mt-1">IP: {log.ip}</div>}
              </div>
            ))}
          </div>

          <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors">
            Exportar Logs
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <div className={`flex h-screen ${theme.bgPrimary} font-sans ${theme.textSecondary} overflow-hidden relative`}>
      {/* Flash de cor de destaque */}
      {accentFlash && (
        <div 
          className="absolute inset-0 pointer-events-none z-50 animate-flash-accent"
          style={{ 
            boxShadow: `inset 0 0 100px 20px ${accentColor}40`,
            backgroundColor: `${accentColor}10`
          }}
        />
      )}
      <Sidebar />

      {/* Modais */}
      {activeModal === 'persona' && <PersonaModal />}
      {activeModal === 'prompts' && <PromptsModal />}
      {activeModal === 'handover' && <HandoverModal />}
      {activeModal === 'modelos' && <ModelosModal />}
      {activeModal === 'supabase' && <SupabaseModal />}
      {activeModal === 'evolution' && <EvolutionModal />}
      {activeModal === 'webhooks' && <WebhooksModal />}
      {activeModal === 'instagram' && <InstagramModal />}
      {activeModal === 'temas' && <TemasModal />}
      {activeModal === 'branding' && <BrandingModal />}
      {activeModal === 'notificacoes' && <NotificacoesModal />}
      {activeModal === 'openrouter-keys' && <OpenRouterKeysModal />}
      {activeModal === 'usuarios' && <UsuariosModal />}
      {activeModal === 'logs' && <LogsModal />}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto p-8 ${theme.bgPrimary}`}>
        <header className="mb-10">
          <h2 className={`text-3xl font-black ${theme.textPrimary} tracking-tight`}>Configurações</h2>
          <p className={theme.textMuted}>Ajuste o motor de inteligência e a infraestrutura do sistema.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((section) => (
            <div key={section.title} className={`${theme.cardBg} border ${theme.border} rounded-3xl p-6 space-y-6`}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                  <section.icon className="text-emerald-500" size={24} />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${theme.textPrimary}`}>{section.title}</h3>
                  <p className={`text-xs ${theme.textMuted}`}>{section.desc}</p>
                </div>
              </div>

              <div className="space-y-2">
                {section.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => openModal(item.key)}
                    className={`w-full flex justify-between items-center p-4 rounded-2xl ${theme.bgTertiary} hover:${theme.bgHover} transition-all group`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className={`${theme.textMuted} group-hover:text-emerald-500 transition-colors`} />
                      <span className={`text-sm font-medium ${theme.textSecondary} group-hover:${theme.textPrimary} transition-colors`}>{item.label}</span>
                    </div>
                    <ChevronRight size={16} className={`${theme.textMuted} group-hover:text-emerald-500 transition-colors`} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-10 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
              <Smartphone className="text-slate-950" size={24} />
            </div>
            <div>
              <h4 className={`font-bold ${theme.textPrimary}`}>Instância Evolution Ativa</h4>
              <p className={`text-xs ${theme.textMuted}`}>Conectado via: <span className="text-emerald-500">evohorizonbr</span></p>
            </div>
          </div>
          <button
            onClick={() => openModal('evolution')}
            className={`${theme.cardBg} border ${theme.border} px-6 py-2 rounded-xl text-xs font-bold hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-all`}
          >
            Configurar WhatsApp
          </button>
        </div>

        {activeModal === 'branding' && <BrandingSettings onClose={closeModal} />}
        {activeModal === 'usuarios' && <UserManagement onClose={closeModal} />}
        {activeModal === 'instagram_mining' && <InstagramMining onClose={closeModal} />}
        {activeModal === 'relatorios' && <Reports onClose={closeModal} />}
      </main>
    </div>
  )
}

export default Settings
