import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Analytics from './pages/Analytics'
import Calendar from './pages/Calendar'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import Economics from './pages/Economics'
import Farm from './pages/Farm'
import Irrigation from './pages/Irrigation'
import Landing from './pages/Landing'
import Market from './pages/Market'
import Recommend from './pages/Recommend'
import Records from './pages/Records'
import Sensors from './pages/Sensors'
import Settings from './pages/Settings'
import { useSidebar } from './contexts/SidebarContext'

export const SIDEBAR_WIDTH = 260

function AppLayout({ children }) {
  const { sidebarOpen, toggleSidebar } = useSidebar()
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={toggleSidebar} />
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="sidebar-overlay"
          onClick={toggleSidebar}
        />
      )}
      <main className="app-main">
        {children}
      </main>
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="app-enter">
      <Routes location={location}>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/chat" element={<AppLayout><Chat /></AppLayout>} />
        <Route path="/recommend" element={<AppLayout><Recommend /></AppLayout>} />
        <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
        <Route path="/farm" element={<AppLayout><Farm /></AppLayout>} />
        <Route path="/market" element={<AppLayout><Market /></AppLayout>} />
        <Route path="/calendar" element={<AppLayout><Calendar /></AppLayout>} />
        <Route path="/irrigation" element={<AppLayout><Irrigation /></AppLayout>} />
        <Route path="/economics" element={<AppLayout><Economics /></AppLayout>} />
        <Route path="/records" element={<AppLayout><Records /></AppLayout>} />
        <Route path="/sensors" element={<AppLayout><Sensors /></AppLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
