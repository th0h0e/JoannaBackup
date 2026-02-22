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
      await pb.collection('users')
        .authWithPassword(email, password)

      if (isMountedRef.current) {
        navigate('/admin/dashboard')
      }
    }
    catch (err: unknown) {
      console.error('Login error:', err)

      if (isMountedRef.current) {
        const error = err as {
          response?: { message?: string }
          message?: string
        }
        const errorMsg
          = error?.response?.message
            || error?.message
            || 'Failed to login. Please check your credentials.'
        setError(errorMsg)
        setLoading(false)
      }
    }
  }

  return (
    <motion.div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-100 px-6"
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
      <div className="relative z-10 w-full max-w-md rounded-sm border border-neutral-200/60 bg-white/90 p-10 backdrop-blur-xl dark:border-neutral-800/60 dark:bg-black/80">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-medium tracking-tight text-neutral-900 dark:text-white">
            Admin Login
          </h1>
          <p className="mt-2 text-xs tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
            Access Dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs tracking-wider text-neutral-500 uppercase dark:text-neutral-400"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="border-neutral-300/60 bg-neutral-100/60 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-neutral-400 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-white dark:placeholder:text-neutral-500 dark:focus-visible:ring-neutral-600"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-xs tracking-wider text-neutral-500 uppercase dark:text-neutral-400"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="border-neutral-300/60 bg-neutral-100/60 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-neutral-400 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-white dark:placeholder:text-neutral-500 dark:focus-visible:ring-neutral-600"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="border-red-800/30 bg-red-950/20"
            >
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            variant="outline"
            className="w-full border-neutral-300/60 bg-neutral-100/30 tracking-wide text-neutral-700 uppercase hover:border-neutral-400/60 hover:bg-neutral-200/50 hover:text-neutral-900 disabled:bg-neutral-200 disabled:text-neutral-400 dark:border-neutral-700/60 dark:bg-black/30 dark:text-neutral-200 dark:hover:border-neutral-600/60 dark:hover:bg-black/50 dark:hover:text-white dark:disabled:bg-neutral-600 dark:disabled:text-neutral-500"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-xs tracking-wide text-neutral-500 uppercase transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            ← Back to Portfolio
          </a>
        </div>
      </div>
    </motion.div>
  )
}
