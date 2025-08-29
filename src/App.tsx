import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthProvider"
import { ThemeProvider } from "./context/ThemeContext"
import { Toaster } from "./components/ui/toaster"
import Dashboard from "./pages/Dashboard"
import ChatsDashboard from "./pages/ChatsDashboard"
import ClientsDashboard from "./pages/ClientsDashboard"
import MetricsDashboard from "./pages/MetricsDashboard"
import KnowledgeManager from "./pages/KnowledgeManager"
import Evolution from "./pages/Evolution"
import Config from "./pages/Config"
import Index from "./pages/Index"
import NotFound from "./pages/NotFound"

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chats" element={<ChatsDashboard />} />
              <Route path="/clients" element={<ClientsDashboard />} />
              <Route path="/metrics" element={<MetricsDashboard />} />
              <Route path="/knowledge" element={<KnowledgeManager />} />
              <Route path="/evolution" element={<Evolution />} />
              <Route path="/config" element={<Config />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
