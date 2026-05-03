import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export interface AppSettings {
  persona: string
  systemPrompt: string
  aiTemperature: number
  aiMaxTokens: number
  handoverTriggers: string[]
  handoverMessage: string
  evolutionApiUrl: string
  evolutionApiKey: string
  evolutionInstance: string
  openRouterKey: string
  notifications: {
    newLeads: boolean
    newMessages: boolean
    handovers: boolean
    tasks: boolean
    reminders: boolean
    goals: boolean
    errors: boolean
  }
  notificationDuration: number
  notificationSound: boolean
}

export const useSettings = () => {
  const { profile } = useAuth()

  const loadSettings = async (): Promise<AppSettings> => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', profile?.organization_id)
        .single()

      if (error) throw error

      const defaultSettings: AppSettings = {
        persona: 'Você é um assistente virtual de vendas...',
        systemPrompt: 'Você é a assistente virtual...',
        aiTemperature: 70,
        aiMaxTokens: 4096,
        handoverTriggers: [
          'Cliente solicita atendimento humano',
          'Palavras-chave de insatisfação detectadas',
          'Cotação complexa',
          'Sinistro reportado',
          'Cancelamento solicitado'
        ],
        handoverMessage: 'Vou transferir você para um de nossos especialistas...',
        evolutionApiUrl: '',
        evolutionApiKey: '',
        evolutionInstance: '',
        openRouterKey: '',
        notifications: {
          newLeads: true,
          newMessages: true,
          handovers: true,
          tasks: true,
          reminders: false,
          goals: true,
          errors: true
        },
        notificationDuration: 5,
        notificationSound: true
      }

      return data?.settings || defaultSettings
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
      return getDefaultSettings()
    }
  }

  const saveSettings = async (settings: AppSettings): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ settings: settings as any })
        .eq('id', profile?.organization_id)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Erro ao salvar configurações:', err)
      return false
    }
  }

  const getDefaultSettings = (): AppSettings => ({
    persona: 'Você é um assistente virtual de vendas da CENTRO SOARES. Seu objetivo é: Atender clientes de forma cordial e profissional, Tirar dúvidas sobre nossos serviços, Encaminhar leads qualificados para a equipe.',
    systemPrompt: 'Você é a assistente virtual da CENTRO SOARES.\n\nCONTEXTO:\n- Você trabalha para uma corretora de serviços\n- Sua função é pré-qualificar leads\n- Use linguagem brasileira natural e amigável\n\nREGRAS:\n1. Sempre se apresente como assistente da CENTRO SOARES\n2. Colete informações relevantes\n3. Para casos complexos, transfira para humano',
    aiTemperature: 70,
    aiMaxTokens: 4096,
    handoverTriggers: [
      'Cliente solicita atendimento humano',
      'Palavras-chave de insatisfação',
      'Cotação complexa',
      'Sinistro reportado',
      'Cancelamento solicitado'
    ],
    handoverMessage: 'Vou transferir você para um de nossos especialistas. Um momento, por favor... 🤝',
    evolutionApiUrl: '',
    evolutionApiKey: '',
    evolutionInstance: '',
    openRouterKey: '',
    notifications: {
      newLeads: true,
      newMessages: true,
      handovers: true,
      tasks: true,
      reminders: false,
      goals: true,
      errors: true
    },
    notificationDuration: 5,
    notificationSound: true
  })

  const resetSettings = async (): Promise<boolean> => {
    return saveSettings(getDefaultSettings())
  }

  return {
    loadSettings,
    saveSettings,
    resetSettings,
    getDefaultSettings
  }
}