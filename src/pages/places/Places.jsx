import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Plus, MapPin, Trash2, X, Loader2, CheckCircle2, Circle, Globe, Navigation } from 'lucide-react'

const CATEGORIES = ['Restaurante', 'Viagem', 'Passeio', 'Show/Evento', 'Outro']

export default function Places() {
  const { couple } = useAuth()
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ name: '', category: 'Restaurante', city: '', maps_url: '', visited: false, notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (couple) fetchPlaces() }, [couple])

  async function fetchPlaces() {
    setLoading(true)
    const { data } = await supabase.from('places').select('*').eq('couple_id', couple.id).order('created_at', { ascending: false })
    setPlaces(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('places').insert({ ...form, couple_id: couple.id })
    await fetchPlaces()
    setForm({ name: '', category: 'Restaurante', city: '', maps_url: '', visited: false, notes: '' })
    setModal(false)
    setSaving(false)
  }

  async function toggleVisited(place) {
    await supabase.from('places').update({ visited: !place.visited }).eq('id', place.id)
    setPlaces(p => p.map(x => x.id === place.id ? { ...x, visited: !x.visited } : x))
  }

  async function handleDelete(id) {
    await supabase.from('places').delete().eq('id', id)
    setPlaces(p => p.filter(x => x.id !== id))
  }

  const filtered = filter === 'all' ? places : filter === 'visited' ? places.filter(p => p.visited) : places.filter(p => !p.visited)

  const catColors = {
    'Restaurante': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'Viagem': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'Passeio': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Show/Evento': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    'Outro': 'text-white/40 bg-white/5 border-white/10',
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black gradient-text">Lugares</h1>
          <p className="text-white/30 text-sm mt-1">{places.filter(p => p.visited).length} visitados · {places.filter(p => !p.visited).length} na lista</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-header">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {[['all','Todos'],['pending','Quero ir'],['visited','Visitados']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === val ? 'btn-neon' : 'glass border border-white/10 text-white/40 hover:text-white/70'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div onClick={() => setModal(true)} className="glass rounded-3xl border border-dashed border-pink-500/30 p-16 flex flex-col items-center gap-4 cursor-pointer hover:border-pink-500/60 transition-all group">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-pink-500/10 group-hover:bg-pink-500/20 transition-all">
            <MapPin className="w-8 h-8 text-pink-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-white/60">Nenhum lugar ainda</p>
            <p className="text-white/25 text-sm mt-1">Adicione restaurantes, destinos e passeios</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(place => (
            <div key={place.id} className={`glass rounded-2xl border border-white/5 flex items-center gap-4 transition-all ${place.visited ? 'opacity-60' : ''}`} style={{ padding: '1rem 1rem 1rem 1.5rem' }}>
              <button onClick={() => toggleVisited(place)} className="flex-shrink-0 transition-all hover:scale-110">
                {place.visited
                  ? <CheckCircle2 className="w-6 h-6 text-pink-400 drop-shadow-[0_0_6px_rgba(247,37,133,0.6)]" />
                  : <Circle className="w-6 h-6 text-white/20 hover:text-pink-400 transition" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-bold text-sm ${place.visited ? 'line-through text-white/40' : 'text-white'}`}>{place.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catColors[place.category]}`}>{place.category}</span>
                </div>
                {place.city && (
                  <div className="flex items-center gap-1 mt-1">
                    <Globe className="w-3 h-3 text-white/20" />
                    <span className="text-xs text-white/30">{place.city}</span>
                  </div>
                )}
                {place.notes && <p className="text-xs text-white/25 mt-1 line-clamp-1">{place.notes}</p>}
              </div>
              <div className="flex items-center gap-1">
                {place.maps_url && (
                  <a href={place.maps_url} target="_blank" rel="noopener noreferrer"
                    className="p-2 text-blue-400/60 hover:text-blue-400 transition rounded-xl hover:bg-blue-500/10"
                    title="Abrir no Maps"
                  >
                    <Navigation className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => handleDelete(place.id)} className="p-2 text-white/15 hover:text-red-400 transition rounded-xl hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="glass-strong modal-scroll rounded-3xl w-full max-w-md" style={{padding: '1.75rem 1.5rem'}}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black gradient-text text-lg">Novo lugar</h2>
              <button onClick={() => setModal(false)} className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="input-cyber w-full rounded-xl text-sm" placeholder="Nome do lugar *" />
              <input type="text" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} className="input-cyber w-full rounded-xl text-sm" placeholder="Cidade / País" />
              <input type="url" value={form.maps_url} onChange={e => setForm(f => ({...f, maps_url: e.target.value}))} className="input-cyber w-full rounded-xl text-sm" placeholder="Link do Google Maps (opcional)" />
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="input-cyber w-full rounded-xl text-sm" style={{padding: '12px 16px'}}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="input-cyber w-full rounded-xl text-sm resize-none" placeholder="Observações..." rows={2} />
              <label className="flex items-center gap-3 cursor-pointer" style={{marginTop: '0.25rem'}}>
                <div
                  onClick={() => setForm(f => ({...f, visited: !f.visited}))}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${form.visited ? 'bg-pink-500 border-pink-500' : 'border-white/20 bg-white/5'}`}
                >
                  {form.visited && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <span className="text-sm text-white/50">Já visitamos</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/40 hover:text-white hover:bg-white/5 transition border border-white/10">Cancelar</button>
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
