import * as Sentry from '@sentry/react'
import { AnimatePresence } from 'motion/react'
import * as React from 'react'
import { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Initialize Sentry as early as possible
Sentry.init({
  dsn: 'https://4981600ff5cc02441de606ca9943a126@o4510808141398016.ingest.de.sentry.io/4510808149983312',
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
})

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
                <div className="min-h-screen bg-black flex items-center justify-center">
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
                <div className="min-h-screen bg-black flex items-center justify-center">
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  </React.StrictMode>,
)
