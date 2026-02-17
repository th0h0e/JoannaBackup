import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import loginBackground from '../../assets/admin-login-bg.jpg'
import pb from '../../config/pocketbase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (pb.authStore.isValid) {
      navigate('/admin/dashboard')
    }
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isMountedRef.current) {
      return
    }

    setError('')
    setLoading(true)

    try {
      await pb.collection('users').authWithPassword(email, password)

      if (isMountedRef.current) {
        navigate('/admin/dashboard')
      }
    }
    catch (err: unknown) {
      console.error('Login error:', err)

      if (isMountedRef.current) {
        const error = err as { response?: { message?: string }, message?: string }
        const errorMsg = error?.response?.message || error?.message || 'Failed to login. Please check your credentials.'
        setError(errorMsg)
        setLoading(false)
      }
    }
  }

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-neutral-100"
      style={{ fontFamily: 'EnduroWeb, sans-serif' }}
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${loginBackground})`,
          filter: 'blur(8px)',
          transform: 'scale(1.1)',
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Login Form */}
      <div className="max-w-md w-full bg-white/90 dark:bg-black/80 rounded-sm border border-neutral-200/60 dark:border-neutral-800/60 p-10 backdrop-blur-xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-xl font-medium text-neutral-900 dark:text-white tracking-tight">
            Admin Login
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 tracking-wide uppercase">
            Access Dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-neutral-100/60 dark:bg-neutral-800/60 border-neutral-300/60 dark:border-neutral-700/60 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-neutral-100/60 dark:bg-neutral-800/60 border-neutral-300/60 dark:border-neutral-700/60 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-950/20 border-red-800/30">
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            variant="outline"
            className="w-full border-neutral-300/60 dark:border-neutral-700/60 bg-neutral-100/30 dark:bg-black/30 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-black/50 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-400/60 dark:hover:border-neutral-600/60 disabled:bg-neutral-200 dark:disabled:bg-neutral-600 disabled:text-neutral-400 dark:disabled:text-neutral-500 uppercase tracking-wide"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors uppercase tracking-wide"
          >
            ← Back to Portfolio
          </a>
        </div>
      </div>
    </motion.div>
  )
}
