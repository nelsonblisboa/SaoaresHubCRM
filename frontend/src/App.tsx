import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ThemeWrapper from './components/ThemeWrapper'
import HandoverAlert from './components/HandoverAlert'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Conversations from './pages/Conversations'
import Chat from './pages/Chat'
import Kanban from './pages/Kanban'
import Settings from './pages/Settings'
import Leads from './pages/Leads'
import Insights from './pages/Insights'
import Campaigns from './pages/Campaigns'
import Sequences from './pages/Sequences'

// Componente para proteger rotas
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { user, loading } = useAuth()
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{element}</>
}

// Componente para rotas públicas (redireciona se já logado)
const PublicRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { user, loading } = useAuth()
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  if (user) return <Navigate to="/" replace />
  return <>{element}</>
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ThemeWrapper>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <div className="min-h-screen transition-colors duration-300">
                {/* Alerta global de handover — renderiza somente quando há pendentes */}
                <HandoverAlert />
                <Routes>
                  <Route path="/login" element={<PublicRoute element={<Login />} />} />
                  <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
                  <Route path="/leads" element={<ProtectedRoute element={<Leads />} />} />
                  <Route path="/conversations" element={<ProtectedRoute element={<Conversations />} />} />
                  <Route path="/chat/:id" element={<ProtectedRoute element={<Chat />} />} />
                  <Route path="/kanban" element={<ProtectedRoute element={<Kanban />} />} />
                  <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
                  <Route path="/insights" element={<ProtectedRoute element={<Insights />} />} />
                  <Route path="/campaigns" element={<ProtectedRoute element={<Campaigns />} />} />
                  <Route path="/sequences" element={<ProtectedRoute element={<Sequences />} />} />
                </Routes>
              </div>
            </BrowserRouter>
          </ThemeWrapper>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App