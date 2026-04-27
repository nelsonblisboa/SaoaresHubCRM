import React from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { useTheme } from '../contexts/ThemeContext'

// ─── Custom Tooltip ───
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

// ─── Funnel Performance Chart (Area) ───
interface FunnelChartProps {
  data?: { name: string; ia: number; manual: number }[]
}

export const FunnelPerformanceChart: React.FC<FunnelChartProps> = ({ data }) => {
  const theme = useThemeClasses()
  const { isDarkMode } = useTheme()

  const defaultData = [
    { name: 'Seg', ia: 12, manual: 5 },
    { name: 'Ter', ia: 19, manual: 8 },
    { name: 'Qua', ia: 15, manual: 6 },
    { name: 'Qui', ia: 22, manual: 9 },
    { name: 'Sex', ia: 28, manual: 11 },
    { name: 'Sáb', ia: 18, manual: 4 },
    { name: 'Dom', ia: 10, manual: 2 },
  ]

  const chartData = data || defaultData

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradientIA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradientManual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#475569" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#475569" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone" dataKey="ia" name="IA"
          stroke="#10b981" strokeWidth={2.5}
          fill="url(#gradientIA)"
          dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
        />
        <Area
          type="monotone" dataKey="manual" name="Manual"
          stroke="#475569" strokeWidth={2}
          fill="url(#gradientManual)"
          dot={{ r: 3, fill: '#475569', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Pipeline Stage Bar Chart ───
interface PipelineChartProps {
  data?: { stage: string; count: number; stagnant: number }[]
}

export const PipelineStageChart: React.FC<PipelineChartProps> = ({ data }) => {
  const { isDarkMode } = useTheme()

  const defaultData = [
    { stage: 'Novo', count: 24, stagnant: 3 },
    { stage: 'Qualificado', count: 18, stagnant: 5 },
    { stage: 'Proposta', count: 12, stagnant: 4 },
    { stage: 'Negociação', count: 8, stagnant: 2 },
    { stage: 'Ganho', count: 15, stagnant: 0 },
    { stage: 'Perdido', count: 6, stagnant: 0 },
  ]

  const chartData = data || defaultData

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
        <XAxis
          dataKey="stage"
          tick={{ fontSize: 9, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Ativos" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
        <Bar dataKey="stagnant" name="Estagnados" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={28} opacity={0.7} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Agent Distribution Pie Chart ───
interface AgentPieProps {
  data?: { name: string; value: number; color: string }[]
}

export const AgentDistributionChart: React.FC<AgentPieProps> = ({ data }) => {
  const defaultData = [
    { name: 'Vendas', value: 45, color: '#10b981' },
    { name: 'Qualificador', value: 25, color: '#3b82f6' },
    { name: 'Suporte', value: 15, color: '#f59e0b' },
    { name: 'Agendador', value: 10, color: '#8b5cf6' },
    { name: 'Reengajamento', value: 5, color: '#ec4899' },
  ]

  const chartData = data || defaultData

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%" cy="50%"
          innerRadius={50} outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ─── Weekly Comparison Mini Chart ───
interface WeeklyBarProps {
  data?: { day: string; leads: number; conversions: number }[]
}

export const WeeklyComparisonChart: React.FC<WeeklyBarProps> = ({ data }) => {
  const { isDarkMode } = useTheme()

  const defaultData = [
    { day: 'Seg', leads: 8, conversions: 2 },
    { day: 'Ter', leads: 12, conversions: 4 },
    { day: 'Qua', leads: 10, conversions: 3 },
    { day: 'Qui', leads: 15, conversions: 5 },
    { day: 'Sex', leads: 20, conversions: 7 },
    { day: 'Sáb', leads: 6, conversions: 1 },
    { day: 'Dom', leads: 3, conversions: 0 },
  ]

  const chartData = data || defaultData

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="leads" name="Leads" fill="#334155" radius={[4, 4, 0, 0]} barSize={12} />
        <Bar dataKey="conversions" name="Conversões" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  )
}
