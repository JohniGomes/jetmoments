import { useAuth } from '../contexts/AuthContext'
import { Heart, Image, BookOpen, MapPin, Star, List, Sparkles, Music2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import couplePhoto from '../assets/couple.jpg'

const modules = [
  {
    to: '/gallery',
    icon: Image,
    label: 'Galeria',
    desc: 'Fotos e vídeos',
    color: 'from-pink-500/20 to-rose-500/10',
    border: 'border-pink-500/20',
    icon_color: 'text-pink-400',
    glow: 'rgba(244,63,94,0.3)',
  },
  {
    to: '/notes',
    icon: BookOpen,
    label: 'Notas',
    desc: 'Memórias escritas',
    color: 'from-purple-500/20 to-violet-500/10',
    border: 'border-purple-500/20',
    icon_color: 'text-purple-400',
    glow: 'rgba(168,85,247,0.3)',
  },
  {
    to: '/places',
    icon: MapPin,
    label: 'Lugares',
    desc: 'Onde ir e onde foram',
    color: 'from-blue-500/20 to-cyan-500/10',
    border: 'border-blue-500/20',
    icon_color: 'text-blue-400',
    glow: 'rgba(59,130,246,0.3)',
  },
  {
    to: '/lists',
    icon: List,
    label: 'Listas',
    desc: 'Rolês e programas',
    color: 'from-amber-500/20 to-yellow-500/10',
    border: 'border-amber-500/20',
    icon_color: 'text-amber-400',
    glow: 'rgba(245,158,11,0.3)',
  },
  {
    to: '/wishlist',
    icon: Star,
    label: 'Desejos',
    desc: 'Sonhos e presentinhos',
    color: 'from-emerald-500/20 to-teal-500/10',
    border: 'border-emerald-500/20',
    icon_color: 'text-emerald-400',
    glow: 'rgba(52,211,153,0.3)',
  },
  {
    to: '/music',
    icon: Music2,
    label: 'Músicas',
    desc: 'Spotify e YouTube',
    color: 'from-green-500/20 to-emerald-500/10',
    border: 'border-green-500/20',
    icon_color: 'text-green-400',
    glow: 'rgba(34,197,94,0.3)',
  },
]

export default function Dashboard() {
  const { user, couple } = useAuth()
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'você'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-16">

      {/* Hero — foto do casal */}
      <div className="relative border border-pink-500/20">
        {/* Imagem com clip */}
        <div className="overflow-hidden">
          <img
            src={couplePhoto}
            alt="Foto do casal"
            className="w-full h-72 sm:h-96 object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07060f] via-[#07060f]/40 to-transparent" />
        </div>

        {/* Texto fora do overflow-hidden */}
        <div className="absolute bottom-0 left-0 right-0 pb-6" style={{ paddingLeft: '0.5rem', paddingRight: '2rem' }}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="text-xs text-pink-400 font-semibold uppercase tracking-widest">{couple?.name}</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            {greeting}, {name}! <span className="gradient-text">♡</span>
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>


      {/* Módulos */}
      <div style={{ marginTop: '0.75rem' }}>
        <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4" style={{ paddingLeft: '0.75rem', marginTop: '-0.5rem' }}>Módulos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {modules.map(({ to, icon: Icon, label, desc, color, border, icon_color, glow }) => (
            <Link
              key={to}
              to={to}
              className={`group relative glass rounded-2xl border ${border} bg-gradient-to-br ${color} hover:scale-[1.03] transition-all duration-200 active:scale-95`}
              style={{ padding: '20px 20px 16px 20px' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300"
                style={{ background: `${glow}30` }}
              >
                <Icon className={`w-5 h-5 ${icon_color} group-hover:drop-shadow-[0_0_8px_var(--glow)]`} />
              </div>
              <p className="font-bold text-white text-sm">{label}</p>
              <p className="text-white/35 text-[11px] mt-0.5">{desc}</p>

              {/* linha neon bottom */}
              <div
                className="absolute bottom-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${glow}, transparent)` }}
              />
            </Link>
          ))}

          {/* Card extra — em breve */}
          <div className="glass rounded-2xl px-5 py-5 border border-white/5 bg-gradient-to-br from-white/5 to-transparent flex flex-col items-center justify-center text-center gap-1 min-h-[100px]">
            <Heart className="w-5 h-5 text-white/15" />
            <p className="text-white/20 text-xs font-medium">Mais em breve</p>
          </div>
        </div>
      </div>
    </div>
  )
}
