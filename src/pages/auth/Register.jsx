import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Sparkles } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('As senhas não coincidem.')
    if (form.password.length < 6) return setError('Senha mínima de 6 caracteres.')
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.name)
      navigate('/couple-setup')
    } catch (err) {
      setError(err.message || 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'name', label: 'Seu nome', type: 'text', placeholder: 'João' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'seu@email.com' },
    { key: 'password', label: 'Senha', type: 'password', placeholder: '••••••••' },
    { key: 'confirm', label: 'Confirmar senha', type: 'password', placeholder: '••••••••' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-[#07060f]">
      <div className="orb w-96 h-96 bg-pink-600/20 -top-20 -right-20" />
      <div className="orb w-80 h-80 bg-purple-700/15 bottom-0 left-0" />
      <div className="bg-grid absolute inset-0 z-0" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 animate-float" style={{background: 'linear-gradient(135deg, #f72585, #7209b7)'}}>
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-4xl font-black gradient-text tracking-tight">J&T Moments</h1>
          <p className="text-white/40 mt-2 text-sm flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Crie sua conta
          </p>
        </div>

        <div className="glass-strong rounded-3xl p-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px h-px w-32 bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">{label}</label>
                <input
                  type={type}
                  required
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="input-cyber w-full rounded-xl px-4 py-3.5 text-sm"
                  placeholder={placeholder}
                />
              </div>
            ))}

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-pink-400 border border-pink-500/30 bg-pink-500/10">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-neon w-full py-3.5 rounded-xl text-sm mt-2">
              {loading ? 'Criando...' : 'Criar conta ♡'}
            </button>
          </form>

          <p className="text-center text-xs text-white/30 mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-pink-400 font-semibold hover:text-pink-300 transition">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
