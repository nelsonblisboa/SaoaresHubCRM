import React, { useState, useRef } from 'react'
import { 
  Upload, 
  X, 
  Save, 
  Image, 
  Type, 
  Palette,
  Check,
  AlertCircle
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

interface BrandingSettingsProps {
  onClose: () => void
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({ onClose }) => {
  const { showSuccess, showError } = useToast()
  const theme = useThemeClasses()
  const { profile } = useAuth()

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [branding, setBranding] = useState({
    company_name: '',
    slogan: '',
    primary_color: '#10b981',
    font_family: 'Inter'
  })

  const [logo, setLogo] = useState<string | null>(null)
  const [favicon, setFavicon] = useState<string | null>(null)
  
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  const fonts = [
    'Inter', 'Roboto', 'Montserrat', 'Poppins', 
    'Open Sans', 'Lato', 'Raleway', 'Nunito'
  ]

  const colors = [
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  React.useEffect(() => {
    loadBranding()
  }, [])

  const loadBranding = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('name, logo, primary_color')
        .eq('id', profile?.organization_id)
        .single()

      if (data) {
        setBranding(prev => ({
          ...prev,
          company_name: data.name || '',
          primary_color: data.primary_color || '#10b981'
        }))
        setLogo(data.logo)
      }
    } catch (err) {
      console.error('Erro ao carregar branding:', err)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `logo_${Date.now()}.${fileExt}`
      const filePath = `branding/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('app-assets')
        .getPublicUrl(filePath)

      setLogo(data.publicUrl)
      showSuccess('Logo enviado!')
    } catch (err: any) {
      showError(err.message || 'Erro ao enviar logo')
    } finally {
      setUploading(false)
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `favicon_${Date.now()}.${fileExt}`
      const filePath = `branding/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('app-assets')
        .getPublicUrl(filePath)

      setFavicon(data.publicUrl)
      showSuccess('Favicon enviado!')
    } catch (err: any) {
      showError(err.message || 'Erro ao enviar favicon')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!branding.company_name.trim()) {
      showError('Nome da empresa é obrigatório')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .from('organizations')
        .update({
          name: branding.company_name,
          primary_color: branding.primary_color,
          logo: logo,
          persona: branding.slogan
        })
        .eq('id', profile?.organization_id)

      if (error) throw error

      showSuccess('Branding salvo!')
      onClose()
    } catch (err: any) {
      showError(err.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${theme.bgCard} border ${theme.border} rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Palette className="text-emerald-500" size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${theme.textPrimary}`}>Branding Customizado</h3>
              <p className={`text-xs ${theme.textMuted}`}>Personalize a identidade visual</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 ${theme.bgHover} rounded-lg`}>
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Company Name */}
          <div>
            <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>
              <Type size={14} className="inline mr-1" />
              Nome da Empresa
            </label>
            <input
              type="text"
              value={branding.company_name}
              onChange={e => setBranding({ ...branding, company_name: e.target.value })}
              placeholder="CENTRO SOARES"
              className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} outline-none focus:border-emerald-500`}
            />
          </div>

          {/* Slogan */}
          <div>
            <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>
              Slogan / Tagline
            </label>
            <input
              type="text"
              value={branding.slogan}
              onChange={e => setBranding({ ...branding, slogan: e.target.value })}
              placeholder="Seguro Esmeralda - Sua proteção em primeiro lugar"
              className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} outline-none focus:border-emerald-500`}
            />
          </div>

          {/* Primary Color */}
          <div>
            <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-3 block`}>
              Cor Principal
            </label>
            <div className="flex gap-3 flex-wrap">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => setBranding({ ...branding, primary_color: color })}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    branding.primary_color === color 
                      ? 'border-white scale-110 shadow-lg' 
                      : 'border-transparent hover:border-white/50'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={branding.primary_color}
                onChange={e => setBranding({ ...branding, primary_color: e.target.value })}
                className="w-10 h-10 rounded-full cursor-pointer"
              />
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>
              Fonte Principal
            </label>
            <select
              value={branding.font_family}
              onChange={e => setBranding({ ...branding, font_family: e.target.value })}
              className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} outline-none`}
            >
              {fonts.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
            <p className={`text-xs ${theme.textMuted} mt-2`}>
              Preview: <span style={{ fontFamily: branding.font_family }}>Aglomeração de vendas</span>
            </p>
          </div>

          {/* Logo Upload */}
          <div>
            <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-3 block`}>
              <Image size={14} className="inline mr-1" />
              Logo Principal
            </label>
            <div className="flex items-center gap-4">
              <div 
                onClick={() => logoInputRef.current?.click()}
                className={`w-24 h-24 ${theme.bgCardSolid} border-2 border-dashed ${theme.border} rounded-xl flex items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-colors overflow-hidden`}
              >
                {logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Upload size={24} className={theme.textMuted} />
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className={`text-xs ${theme.textMuted}`}>
                  Clique ou arraste a imagem. PNG ou JPG recomendado.
                </p>
                <p className={`text-xs ${theme.textMuted}`}>
                  Tamanho: 200x200px ou superior
                </p>
              </div>
            </div>
          </div>

          {/* Favicon Upload */}
          <div>
            <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-3 block`}>
              Ícone / Favicon
            </label>
            <div className="flex items-center gap-4">
              <div 
                onClick={() => faviconInputRef.current?.click()}
                className={`w-16 h-16 ${theme.bgCardSolid} border-2 border-dashed ${theme.border} rounded-xl flex items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-colors overflow-hidden`}
              >
                {favicon ? (
                  <img src={favicon} alt="Favicon" className="w-full h-full object-contain" />
                ) : (
                  <Upload size={20} className={theme.textMuted} />
                )}
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className={`text-xs ${theme.textMuted}`}>
                  Ícone para a aba do navegador. PNG 32x32px.
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className={`p-4 ${theme.bgCardSolid} rounded-xl`}>
            <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-3 block`}>
              Preview
            </label>
            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: branding.primary_color + '20', borderColor: branding.primary_color }}
            >
              <div className="flex items-center gap-3">
                {logo && <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />}
                <div>
                  <p className="font-bold" style={{ color: branding.primary_color, fontFamily: branding.font_family }}>
                    {branding.company_name || 'Empresa'}
                  </p>
                  <p className={`text-xs ${theme.textMuted}`}>{branding.slogan}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-6 border-t ${theme.border}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl ${theme.textMuted} hover:${theme.textSecondary}`}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition-colors"
          >
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}