import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ThemeWrapper from './components/ThemeWrapper'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Conversations from './pages/Conversations'
import Chat from './pages/Chat'
import Kanban from './pages/Kanban'
import Settings from './pages/Settings'
import Leads from './pages/Leads'
import Insights from './pages/Insights'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ThemeWrapper>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <div className="min-h-screen transition-colors duration-300">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/conversations" element={<Conversations />} />
                <Route path="/chat/:id" element={<Chat />} />
                <Route path="/kanban" element={<Kanban />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/insights" element={<Insights />} />
              </Routes>
            </div>
          </BrowserRouter>
        </ThemeWrapper>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App