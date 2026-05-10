import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Link2, Plus, Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function CoupleSetup() {
  const { user, fetchCouple } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('create')
  const [coupleName, setCoupleName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const code = generateInviteCode()
      const { data: couple, error: coupleErr } = await supabase
        .from('couples')
        .insert({ name: coupleName, invite_code: code })
        .select()
        .single()
      if (coupleErr) throw coupleErr

      const { error: memberErr } = await supabase
        .from('couple_members')
        .insert({ couple_id: couple.id, user_id: user.id })
      if (memberErr) throw memberErr

      await fetchCouple(user.id)
      navigate('/')
    } catch (err) {
      setError('Erro ao criar o espaço: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data: couple, error: coupleErr } = await supabase
        .from('couples')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (coupleErr || !couple) { setError('Código inválido.'); setLoading(false); return }

      const { data: existing } = await supabase.from('couple_members').select('id').eq('couple_id', couple.id)
      if (existing && existing.length >= 2) { setError('Espaço já está cheio.'); setLoading(false); return }

      const { error: memberErr } = await supabase.from('couple_members').insert({ couple_id: couple.id, user_id: user.id })
      if (memberErr) throw memberErr

      await fetchCouple(user.id)
      navigate('/')
    } catch (err) {
      setError('Erro ao entrar: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-8 relative overflow-hidden bg-[#07060f]">
      <div className="orb w-96 h-96 bg-pink-600/20 top-0 left-0" />
      <div className="orb w-72 h-72 bg-purple-700/20 bottom-0 right-0" />
      <div className="bg-grid absolute inset-0 z-0" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 animate-float" style={{background: 'linear-gradient(135deg, #f72585, #7209b7)'}}>
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-black gradient-text">Seu espaço</h1>
          <p className="text-white/40 mt-2 text-sm flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Crie ou entre em um espaço compartilhado
          </p>
        </div>

        <div className="glass-strong rounded-3xl" style={{padding: '2rem 1.5rem'}}>
          {/* Tabs */}
          <div className="flex rounded-2xl overflow-hidden p-1 mb-7" style={{background:'rgba(255,255,255,0.05)'}}>
            {[
              { key: 'create', icon: Plus, label: 'Criar' },
              { key: 'join', icon: Link2, label: 'Entrar' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tab === key
                    ? 'btn-neon'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Nome do casal</label>
                <input
                  type="text"
                  required
                  value={coupleName}
                  onChange={e => setCoupleName(e.target.value)}
                  className="input-cyber w-full rounded-xl px-4 py-3.5 text-sm"
                  placeholder="J&T Moments"
                />
              </div>
              {error && <div className="rounded-xl px-4 py-3 text-sm text-pink-400 border border-pink-500/30 bg-pink-500/10">{error}</div>}
              <button type="submit" disabled={loading} className="btn-neon w-full py-3.5 rounded-xl text-sm">
                {loading ? 'Criando...' : 'Criar espaço ♡'}
              </button>
              <p className="text-xs text-white/25 text-center">Um código de convite será gerado para conectar seu par</p>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Código de convite</label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  className="input-cyber w-full rounded-xl px-4 py-3.5 text-center text-2xl font-mono tracking-[0.5em] uppercase"
                  placeholder="ABC123"
                  maxLength={6}
                />
              </div>
              {error && <div className="rounded-xl px-4 py-3 text-sm text-pink-400 border border-pink-500/30 bg-pink-500/10">{error}</div>}
              <button type="submit" disabled={loading} className="btn-neon w-full py-3.5 rounded-xl text-sm">
                {loading ? 'Entrando...' : 'Entrar no espaço ♡'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
