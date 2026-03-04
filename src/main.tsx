import { AnimatePresence } from 'motion/react'
import * as React from 'react'
import { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Lazy load admin pages - only downloaded when user visits /admin routes
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.tsx'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.tsx'))

export function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<App />} />
        <Route
          path="/admin"
          element={(
            <Suspense
              fallback={(
                <div className="flex min-h-screen items-center justify-center bg-black">
                  <div className="text-xl text-white">Loading...</div>
                </div>
              )}
            >
              <AdminLogin />
            </Suspense>
          )}
        />
        <Route
          path="/admin/dashboard"
          element={(
            <Suspense
              fallback={(
                <div className="flex min-h-screen items-center justify-center bg-black">
                  <div className="text-xl text-white">Loading...</div>
                </div>
              )}
            >
              <AdminDashboard />
            </Suspense>
          )}
        />
      </Routes>
    </AnimatePresence>
  )
}

ReactDOM.createRoot(document.getElementById('root')!)
  .render(
    <React.StrictMode>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </React.StrictMode>,
  )
