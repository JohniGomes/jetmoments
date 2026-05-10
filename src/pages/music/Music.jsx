import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Plus, Music2, Trash2, X, Loader2, Link } from 'lucide-react'

function getEmbedData(url) {
  try {
    // Spotify track
    const spotifyTrack = url.match(/spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/)
    if (spotifyTrack) {
      return {
        type: 'spotify',
        embed: `https://open.spotify.com/embed/${spotifyTrack[1]}/${spotifyTrack[2]}?utm_source=generator&theme=0`,
        height: spotifyTrack[1] === 'track' ? 152 : 352,
      }
    }

    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (ytMatch) {
      return {
        type: 'youtube',
        embed: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0`,
        height: 200,
      }
    }

    return null
  } catch {
    return null
  }
}

export default function Music() {
  const { couple } = useAuth()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title: '', url: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (couple) fetchTracks() }, [couple])

  async function fetchTracks() {
    setLoading(true)
    const { data } = await supabase
      .from('music')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
    setTracks(data || [])
    setLoading(false)
  }

  async function handleSave() {
    setError('')
    if (!form.title.trim() || !form.url.trim()) return
    const embed = getEmbedData(form.url)
    if (!embed) {
      setError('Link inválido. Use links do Spotify ou YouTube.')
      return
    }
    setSaving(true)
    await supabase.from('music').insert({
      couple_id: couple.id,
      title: form.title,
      url: form.url,
      type: embed.type,
    })
    await fetchTracks()
    setForm({ title: '', url: '' })
    setModal(false)
    setSaving(false)
  }

  async function handleDelete(id) {
    await supabase.from('music').delete().eq('id', id)
    setTracks(t => t.filter(x => x.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black gradient-text">Músicas</h1>
          <p className="text-white/30 text-sm mt-1">{tracks.length} {tracks.length === 1 ? 'música' : 'músicas'} salvas</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="btn-neon flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      ) : tracks.length === 0 ? (
        <div
          onClick={() => setModal(true)}
          className="glass rounded-3xl border border-dashed border-pink-500/30 flex flex-col items-center gap-4 cursor-pointer hover:border-pink-500/60 transition-all group"
          style={{ padding: '4rem 2rem' }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-pink-500/10 group-hover:bg-pink-500/20 transition-all">
            <Music2 className="w-8 h-8 text-pink-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-white/60">Nenhuma música ainda</p>
            <p className="text-white/25 text-sm mt-1">Cole links do Spotify ou YouTube</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {tracks.map(track => {
            const embed = getEmbedData(track.url)
            return (
              <div key={track.id} className="glass rounded-2xl border border-white/5 overflow-hidden">
                {/* Header do card */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${track.type === 'spotify' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      <Music2 className={`w-3.5 h-3.5 ${track.type === 'spotify' ? 'text-green-400' : 'text-red-400'}`} />
                    </div>
                    <p className="font-semibold text-white text-sm truncate">{track.title}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(track.id)}
                    className="flex-shrink-0 ml-2 p-1.5 text-white/20 hover:text-red-400 transition rounded-lg hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Player embed */}
                {embed && (
                  <iframe
                    src={embed.embed}
                    height={embed.height}
                    width="100%"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ display: 'block' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-strong rounded-3xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black gradient-text text-lg">Adicionar música</h2>
              <button onClick={() => { setModal(false); setError('') }} className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="input-cyber w-full rounded-xl px-4 py-3 text-sm"
                placeholder='Nome da música ou playlist *'
              />
              <div className="relative">
                <input
                  type="url"
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className="input-cyber w-full rounded-xl px-4 py-3 pl-10 text-sm"
                  placeholder="Link do Spotify ou YouTube *"
                />
                <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              </div>

              {/* Dica */}
              <div className="flex gap-3 text-[11px] text-white/25">
                <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400/70">✓ Spotify</span>
                <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400/70">✓ YouTube</span>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm text-pink-400 border border-pink-500/30 bg-pink-500/10">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setModal(false); setError('') }} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/40 hover:text-white hover:bg-white/5 transition border border-white/10">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 btn-neon py-3 rounded-2xl text-sm font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Salvar ♡'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
