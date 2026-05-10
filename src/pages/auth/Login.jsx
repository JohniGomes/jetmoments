import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Sparkles } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(form.email, form.password)
      navigate('/')
    } catch {
      setError('Email ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#07060f]">
      {/* Orbs de fundo */}
      <div className="orb w-96 h-96 bg-pink-600/20 -top-20 -left-20" />
      <div className="orb w-80 h-80 bg-purple-700/15 bottom-0 right-0" />
      <div className="bg-grid absolute inset-0 z-0" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 relative animate-float" style={{background: 'linear-gradient(135deg, #f72585, #7209b7)'}}>
            <Heart className="w-10 h-10 text-white fill-white" />
            <div className="absolute inset-0 rounded-2xl animate-pulse-neon" />
          </div>
          <h1 className="text-4xl font-black gradient-text tracking-tight">J&T Moments</h1>
          <p className="text-white/40 mt-2 text-sm flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Bem-vindo de volta
          </p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px h-px w-32 bg-gradient-to-r from-transparent via-pink-500 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input-cyber w-full rounded-xl px-4 py-3.5 text-sm"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Senha</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input-cyber w-full rounded-xl px-4 py-3.5 text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-pink-400 border border-pink-500/30 bg-pink-500/10">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-neon w-full py-3.5 rounded-xl text-sm mt-2">
              {loading ? 'Entrando...' : 'Entrar ♡'}
            </button>
          </form>

          <p className="text-center text-xs text-white/30 mt-6">
            Sem conta?{' '}
            <Link to="/register" className="text-pink-400 font-semibold hover:text-pink-300 transition">
              Criar agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
