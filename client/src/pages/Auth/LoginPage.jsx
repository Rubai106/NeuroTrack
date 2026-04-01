import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Zap, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const getAuthErrorMessage = (err, fallback) => {
  if (err?.code === 'ECONNABORTED') {
    return 'Server took too long to respond. Please try again in a few seconds.'
  }
  if (!err?.response) {
    return 'Cannot reach server. Check deployment URL/CORS or wait for backend wake-up.'
  }
  return err.response?.data?.message || fallback
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      toast.error(getAuthErrorMessage(err, 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-sage-600 p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-white font-semibold">NeuroTrack</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold text-white leading-tight mb-4">
            Study smarter,<br />not harder.
          </h2>
          <p className="text-sage-200 text-sm leading-relaxed">
            Track your sessions, understand your weaknesses, and get personalized insights to reach your goals.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              ['📊', 'Smart Analytics'],
              ['🎯', 'Weakness Detection'],
              ['🤖', 'AI Study Coach'],
              ['🏆', 'Gamification'],
            ].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <span>{icon}</span>
                <span className="text-white/90 text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sage-300 text-xs">Built for students who take studying seriously.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-sage-600 rounded-lg flex items-center justify-center">
              <Zap size={13} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900">NeuroTrack</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-7">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} className="input pr-10"
                  placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {loading ? <span className="animate-pulse">Signing in…</span> : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-sage-600 font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
