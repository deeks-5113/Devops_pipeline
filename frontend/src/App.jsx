import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FolderView from './pages/FolderView'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { MetricsProvider } from './hooks/useMetricsHistory'
import CommandPalette from './components/CommandPalette'

function App() {
  return (
    <MetricsProvider>
      <BrowserRouter>
        <CommandPalette />
        <Routes>
          <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/"                  element={<Dashboard />} />
            <Route path="/folder/:groupId"   element={<FolderView />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </BrowserRouter>
    </MetricsProvider>
  )
}

export default App
