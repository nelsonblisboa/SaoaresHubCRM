import React, { useMemo } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import useThemeClasses from '../hooks/useThemeClasses'

// Sales Performance Chart
export const SalesPerformanceChart = () => {
  const theme = useThemeClasses()
  
  const chartData = [
    { month: 'Jan', sales: 4000, revenue: 2400 },
    { month: 'Feb', sales: 3000, revenue: 1398 },
    { month: 'Mar', sales: 9800, revenue: 2000 },
    { month: 'Apr', sales: 3908, revenue: 2780 },
    { month: 'May', sales: 4800, revenue: 1890 },
    { month: 'Jun', sales: 3800, revenue: 2390 },
    { month: 'Jul', sales: 4300, revenue: 3490 },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12, fill: theme.textMuted }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: theme.textMuted }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: theme.bgCard,
            borderColor: theme.border,
            borderRadius: '8px',
            border: '1px solid ' + theme.border
          }}
          itemStyle={{ color: theme.textPrimary }}
        />
        <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" />
        <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Pipeline Stage Chart
export const PipelineStageChart = () => {
  const theme = useThemeClasses()
  
  const chartData = [
    { stage: 'Qualificação', leads: 400, converted: 240 },
    { stage: 'Proposta', leads: 300, converted: 138 },
    { stage: 'Negociação', leads: 200, converted: 980 },
    { stage: 'Fechamento', leads: 278, converted: 390 },
    { stage: 'Pós-venda', leads: 189, converted: 480 },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
        <XAxis 
          dataKey="stage" 
          tick={{ fontSize: 12, fill: theme.textMuted }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: theme.textMuted }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: theme.bgCard,
            borderColor: theme.border,
            borderRadius: '8px',
            border: '1px solid ' + theme.border
          }}
          itemStyle={{ color: theme.textPrimary }}
        />
        <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="converted" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Agent Distribution Chart
export const AgentDistributionChart = () => {
  const theme = useThemeClasses()
  
  const data = [
    { name: 'Vendas', value: 400, color: '#10b981' },
    { name: 'Qualificador', value: 300, color: '#3b82f6' },
    { name: 'Suporte', value: 300, color: '#f59e0b' },
    { name: 'Agendador', value: 200, color: '#8b5cf6' },
    { name: 'Reengajamento', value: 278, color: '#ec4899' },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: theme.bgCard,
            borderColor: theme.border,
            borderRadius: '8px',
            border: '1px solid ' + theme.border
          }}
          itemStyle={{ color: theme.textPrimary }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Weekly Comparison Chart
export const WeeklyComparisonChart = () => {
  const theme = useThemeClasses()
  
  const data = [
    { day: 'Seg', leads: 45, conversions: 12 },
    { day: 'Ter', leads: 52, conversions: 15 },
    { day: 'Qua', leads: 38, conversions: 8 },
    { day: 'Qui', leads: 61, conversions: 22 },
    { day: 'Sex', leads: 20, conversions: 7 },
    { day: 'Sáb', leads: 6, conversions: 1 },
    { day: 'Dom', leads: 3, conversions: 0 },
  ]

  const chartData = data

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: theme.textMuted }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: theme.textMuted }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: theme.bgCard,
            borderColor: theme.border,
            borderRadius: '8px',
            border: '1px solid ' + theme.border
          }}
          itemStyle={{ color: theme.textPrimary }}
        />
        <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="conversions" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Funnel Performance Chart
export const FunnelPerformanceChart = () => {
  const theme = useThemeClasses()
  
  const chartData = [
    { stage: 'Visitantes', value: 1000, conversion: 100 },
    { stage: 'Leads', value: 800, conversion: 80 },
    { stage: 'Qualificados', value: 600, conversion: 60 },
    { stage: 'Propostas', value: 400, conversion: 40 },
    { stage: 'Fechados', value: 200, conversion: 20 },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
        <XAxis type="number" tick={{ fontSize: 12, fill: theme.textMuted }} />
        <YAxis 
          type="category" 
          dataKey="stage" 
          tick={{ fontSize: 12, fill: theme.textMuted }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: theme.bgCard,
            borderColor: theme.border,
            borderRadius: '8px',
            border: '1px solid ' + theme.border
          }}
          itemStyle={{ color: theme.textPrimary }}
        />
        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}