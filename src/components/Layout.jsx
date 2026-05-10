import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Heart, Image, BookOpen, MapPin, Star, List, LogOut, Home, Copy, Check, Music2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

const navItems = [
  { to: '/', icon: Home, label: 'Início', end: true },
  { to: '/gallery', icon: Image, label: 'Galeria' },
  { to: '/notes', icon: BookOpen, label: 'Notas' },
  { to: '/places', icon: MapPin, label: 'Lugares' },
  { to: '/lists', icon: List, label: 'Listas' },
  { to: '/wishlist', icon: Star, label: 'Desejos' },
  { to: '/music', icon: Music2, label: 'Músicas' },
]

export default function Layout() {
  const { signOut, couple, user } = useAuth()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(couple?.invite_code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#07060f]">
      {/* Orbs globais */}
      <div className="orb w-[500px] h-[500px] bg-pink-700/10 -top-40 -right-40 fixed" />
      <div className="orb w-[400px] h-[400px] bg-purple-800/10 bottom-0 -left-20 fixed" />
      <div className="bg-grid fixed inset-0 z-0 pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 sticky top-0">
        <div className="glass border-b border-pink-500/10 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#f72585,#7209b7)'}}>
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-black gradient-text text-lg tracking-tight">{couple?.name || 'J&T Moments'}</span>
          </div>
          <div className="flex items-center gap-2">
            {couple?.invite_code && (
              <button
                onClick={copyCode}
                title="Copiar código de convite"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pink-500/15 hover:border-pink-500/40 hover:bg-pink-500/5 transition-all"
              >
                <span className="font-mono text-xs font-bold text-pink-400/60">{couple.invite_code}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-white/20" />}
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="p-2 text-white/30 hover:text-pink-400 transition rounded-xl hover:bg-pink-500/10"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 relative z-10 pb-24 md:pb-8 md:ml-64 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Bottom nav — mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 md:hidden">
        <div className="glass border-t border-pink-500/10 px-2 py-2 flex items-center justify-around">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all text-[10px] font-semibold ${
                  isActive
                    ? 'text-pink-400'
                    : 'text-white/30 hover:text-white/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-pink-500/20' : ''}`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'drop-shadow-[0_0_6px_rgba(247,37,133,0.8)]' : ''}`} />
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Sidebar — desktop */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-20">
        <div className="glass border-r border-pink-500/10 h-full flex flex-col pt-20 px-4 pb-6">
          {/* Logo no topo */}
          <div className="flex items-center gap-3 px-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#f72585,#7209b7)'}}>
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <p className="font-black gradient-text text-sm">{couple?.name || 'J&T Moments'}</p>
              <p className="text-white/30 text-xs">{user?.user_metadata?.name}</p>
            </div>
          </div>

          <div className="space-y-1 flex-1">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-pink-500/15 text-pink-400 border border-pink-500/20'
                      : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'drop-shadow-[0_0_6px_rgba(247,37,133,0.8)]' : ''}`} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Código de convite — sidebar */}
          {couple?.invite_code && (
            <div className="mb-3 px-1">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1.5 px-3">Código de convite</p>
              <button
                onClick={copyCode}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-pink-500/10 hover:border-pink-500/30 hover:bg-pink-500/5 transition-all group"
              >
                <span className="font-mono font-black text-pink-400/70 tracking-[0.25em] text-sm group-hover:text-pink-400">
                  {couple.invite_code}
                </span>
                {copied
                  ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                  : <Copy className="w-3.5 h-3.5 text-white/20 group-hover:text-pink-400" />
                }
              </button>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-white/30 hover:text-pink-400 hover:bg-pink-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </nav>
    </div>
  )
}
