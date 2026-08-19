import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import Navbar from './components/Navbar.jsx'
import HeroSection from './components/HeroSection.jsx'
import StatusBanner from './components/StatusBanner.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ResumesListPage from './pages/ResumesListPage.jsx'
import ResumeFormPage from './pages/ResumeFormPage.jsx'
import AnalysisPage from './pages/AnalysisPage.jsx'
import JobMatchPage from './pages/JobMatchPage.jsx'
import InterviewPage from './pages/InterviewPage.jsx'
import InterviewSessionPage from './pages/InterviewSessionPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'

import { useState, useEffect } from 'react'

function HomePage() {
  const [apiStatus, setApiStatus] = useState(null)

  useEffect(() => {
    setApiStatus('loading')
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setApiStatus(data.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setApiStatus('error'))
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <StatusBanner status={apiStatus} />
        <HeroSection />
      </main>
    </div>
  )
}

function P({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"         element={<HomePage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route path="/dashboard"          element={<P><DashboardPage /></P>} />
          <Route path="/resumes"            element={<P><ResumesListPage /></P>} />
          <Route path="/resumes/new"        element={<P><ResumeFormPage /></P>} />
          <Route path="/resumes/:id/edit"   element={<P><ResumeFormPage /></P>} />
          <Route path="/resumes/:id/analysis" element={<P><AnalysisPage /></P>} />
          <Route path="/job-match"          element={<P><JobMatchPage /></P>} />
          <Route path="/interview"          element={<P><InterviewPage /></P>} />
          <Route path="/interview/:id"      element={<P><InterviewSessionPage /></P>} />
          <Route path="/analytics"          element={<P><AnalyticsPage /></P>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
