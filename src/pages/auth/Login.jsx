import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Sparkles, LogIn, UserPlus, Link2, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function Login() {
  const { signIn, signUp, setCouple } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', coupleName: '' })
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: '', code: '' })

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(loginForm.email, loginForm.password)
      navigate('/', { replace: true })
    } catch {
      setError('Email ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    if (registerForm.password.length < 6) return setError('Senha mínima de 6 caracteres.')
    setLoading(true)
    try {
      const { data: authData } = await signUp(registerForm.email, registerForm.password, registerForm.name)
      const userId = authData?.user?.id
      if (!userId) throw new Error('Erro ao criar conta.')

      const code = generateInviteCode()
      const { data: coupleData, error: coupleErr } = await supabase
        .from('couples')
        .insert({ name: registerForm.coupleName || `Casal de ${registerForm.name}`, invite_code: code })
        .select()
        .maybeSingle()
      if (coupleErr) throw coupleErr

      await supabase.from('couple_members').insert({ couple_id: coupleData.id, user_id: userId })

      setCouple(coupleData)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite(e) {
    e.preventDefault()
    setError('')
    if (inviteForm.password.length < 6) return setError('Senha mínima de 6 caracteres.')
    setLoading(true)
    try {
      const { data: coupleData, error: coupleErr } = await supabase
        .from('couples')
        .select('id, name, created_at, invite_code')
        .eq('invite_code', inviteForm.code.toUpperCase().trim())
        .maybeSingle()
      if (coupleErr || !coupleData) { setError('Código de convite inválido.'); setLoading(false); return }

      const { data: authData } = await signUp(inviteForm.email, inviteForm.password, inviteForm.name)
      const userId = authData?.user?.id
      if (!userId) throw new Error('Erro ao criar conta.')

      await supabase.from('couple_members').insert({ couple_id: coupleData.id, user_id: userId })

      setCouple(coupleData)
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('20 seconds') || msg.includes('rate') || msg.includes('security purposes')) {
        setError('Aguarde alguns segundos e tente novamente.')
      } else if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('Este email já possui uma conta. Use a aba Entrar.')
      } else {
        setError(msg || 'Erro ao entrar com convite.')
      }
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'login', label: 'Entrar', icon: LogIn },
    { key: 'register', label: 'Criar conta', icon: UserPlus },
    { key: 'invite', label: 'Convite', icon: Link2 },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-8 relative overflow-hidden bg-[#07060f]">
      <div className="orb w-96 h-96 bg-pink-600/20 -top-20 -left-20" />
      <div className="orb w-80 h-80 bg-purple-700/15 bottom-0 right-0" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 relative animate-float" style={{background:'linear-gradient(135deg,#f72585,#7209b7)'}}>
            <Heart className="w-10 h-10 text-white fill-white" />
            <div className="absolute inset-0 rounded-2xl animate-pulse-neon" />
          </div>
          <h1 className="text-4xl font-black gradient-text tracking-tight">J&T Moments</h1>
          <p className="text-white/40 mt-2 text-sm flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Seu espaço do casal
          </p>
        </div>

        <div className="glass-strong rounded-3xl" style={{padding:'1.75rem 1.5rem'}}>
          {/* Tabs */}
          <div className="flex rounded-2xl p-1 mb-6" style={{background:'rgba(255,255,255,0.05)', gap:'4px'}}>
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setError('') }}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  ...(tab === key
                    ? { background: 'linear-gradient(135deg,#f72585,#b5179e)', color: 'white', boxShadow: '0 0 12px rgba(247,37,133,0.35)' }
                    : { background: 'transparent', color: 'rgba(255,255,255,0.35)' })
                }}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>

          {/* Login */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Email</label>
                <input type="email" required value={loginForm.email} onChange={e => setLoginForm(f=>({...f,email:e.target.value}))} className="input-cyber w-full rounded-xl text-sm" placeholder="seu@email.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Senha</label>
                <input type="password" required value={loginForm.password} onChange={e => setLoginForm(f=>({...f,password:e.target.value}))} className="input-cyber w-full rounded-xl text-sm" placeholder="••••••••" />
              </div>
              {error && <div className="rounded-xl px-4 py-3 text-sm text-pink-400 border border-pink-500/30 bg-pink-500/10">{error}</div>}
              <button type="submit" disabled={loading} className="btn-neon w-full py-3.5 rounded-xl text-sm" style={{marginTop:'0.5rem'}}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Entrar ♡'}
              </button>
            </form>
          )}

          {/* Criar conta */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Seu nome</label>
                <input type="text" required value={registerForm.name} onChange={e => setRegisterForm(f=>({...f,name:e.target.value}))} className="input-cyber w-full rounded-xl text-sm" placeholder="Johni" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Email</label>
                <input type="email" required value={registerForm.email} onChange={e => setRegisterForm(f=>({...f,email:e.target.value}))} className="input-cyber w-full rounded-xl text-sm" placeholder="seu@email.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Senha</label>
                <input type="password" required value={registerForm.password} onChange={e => setRegisterForm(f=>({...f,password:e.target.value}))} className="input-cyber w-full rounded-xl text-sm" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Nome do espaço</label>
                <input type="text" value={registerForm.coupleName} onChange={e => setRegisterForm(f=>({...f,coupleName:e.target.value}))} className="input-cyber w-full rounded-xl text-sm" placeholder="J&T Moments" />
              </div>
              {error && <div className="rounded-xl px-4 py-3 text-sm text-pink-400 border border-pink-500/30 bg-pink-500/10">{error}</div>}
              <button type="submit" disabled={loading} className="btn-neon w-full py-3.5 rounded-xl text-sm" style={{marginTop:'0.5rem'}}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Criar conta ♡'}
              </button>
            </form>
          )}

          {/* Entrar com convite */}
          {tab === 'invite' && (
            <form onSubmit={handleInvite} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Seu nome</label>
                <input type="text" required value={inviteForm.name} onChange={e => setInviteForm(f=>({...f,name:e.target.value}))} className="input-cyber w-full rounded-xl text-sm" placeholder="Thallyta" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Email</label>
                <input type="email" required value={inviteForm.email} onChange={e => setInviteForm(f=>({...f,email:e.target.value}))} className="input-cyber w-full rounded-xl text-sm" placeholder="seu@email.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Senha</label>
                <input type="password" required value={inviteForm.password} onChange={e => setInviteForm(f=>({...f,password:e.target.value}))} className="input-cyber w-full rounded-xl text-sm" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Código de convite</label>
                <input type="text" required value={inviteForm.code} onChange={e => setInviteForm(f=>({...f,code:e.target.value}))} className="input-cyber w-full rounded-xl text-sm text-center font-mono tracking-widest uppercase" placeholder="ABC123" maxLength={6} />
              </div>
              {error && <div className="rounded-xl px-4 py-3 text-sm text-pink-400 border border-pink-500/30 bg-pink-500/10">{error}</div>}
              <button type="submit" disabled={loading} className="btn-neon w-full py-3.5 rounded-xl text-sm" style={{marginTop:'0.5rem'}}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Entrar no espaço ♡'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
