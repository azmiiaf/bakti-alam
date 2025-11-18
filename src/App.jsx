import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/services/AuthContext.jsx'
import { useAuth } from './components/services/useAuth.js'
import { ToastContainer } from 'react-toastify'
import AuthPage from './pages/AuthPage'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import ReportsPage from './pages/ReportsPage'
import EmailCallback from './pages/EmailCallback'
import MainLayout from './components/Layout/MainLayout'
import 'react-toastify/dist/ReactToastify.css'

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAdmin, isUser } = useAuth()
  
  if (!user) {
    return <Navigate to="/auth" replace />
  }
  
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }
  
  if (requiredRole === 'user' && !isUser) {
    return <Navigate to="/admin" replace />
  }
  
  return children
}

const AppRoutes = () => {
  const { user } = useAuth()
  
  return (
    <Routes>
      <Route
        path="/auth"
        element={!user ? <AuthPage /> : <Navigate to="/dashboard" replace />}
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="user">
            <MainLayout>
              <UserDashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <AdminDashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/auth/callback"
        element={<EmailCallback />}
      />
      
      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <ReportsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/"
        element={
          <MainLayout>
            <UserDashboard />
          </MainLayout>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastClassName="Toastify__toast"
            progressClassName="Toastify__progress"
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
