'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data: profile, error: lookupError } = await supabase
      .from('profiles')
      .select('auth_email, role')
      .eq('username', username.trim().toLowerCase())
      .single()

    if (lookupError || !profile) {
      setError('Username not found. Please try again.')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: profile.auth_email,
      password,
    })

    if (authError) {
      setError('Incorrect passcode. Please try again.')
      setLoading(false)
      return
    }

    router.push(profile.role === 'employee' ? '/employee' : '/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="mb-6">
            <span className="font-[family-name:var(--font-bebas)] text-6xl tracking-[0.15em] text-white leading-none">
              CHO VENTURES
            </span>
          </div>
          <p className="text-slate-400 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your.username"
                required
                autoComplete="username"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Passcode</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-6">
            Contact your HR administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  )
}
