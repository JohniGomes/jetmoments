import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Plus, Star, Trash2, X, Loader2, ExternalLink, Gift } from 'lucide-react'

const PRIORITIES = [
  { value: 'alta', label: '🔥 Alta', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { value: 'media', label: '💛 Média', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'baixa', label: '💙 Baixa', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
]

export default function Wishlist() {
  const { couple, user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', link: '', priority: 'media', for_who: 'ambos' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (couple) fetchItems() }, [couple])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase.from('wishlist').select('*').eq('couple_id', couple.id).order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('wishlist').insert({ ...form, couple_id: couple.id, user_id: user.id })
    await fetchItems()
    setForm({ name: '', link: '', priority: 'media', for_who: 'ambos' })
    setModal(false)
    setSaving(false)
  }

  async function handleDelete(id) {
    await supabase.from('wishlist').delete().eq('id', id)
    setItems(i => i.filter(x => x.id !== id))
  }

  const priorityInfo = (val) => PRIORITIES.find(p => p.value === val) || PRIORITIES[1]

  const grouped = {
    alta: items.filter(i => i.priority === 'alta'),
    media: items.filter(i => i.priority === 'media'),
    baixa: items.filter(i => i.priority === 'baixa'),
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black gradient-text">Desejos</h1>
          <p className="text-white/30 text-sm mt-1">{items.length} {items.length === 1 ? 'desejo' : 'desejos'} na lista</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-neon flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div onClick={() => setModal(true)} className="glass rounded-3xl border border-dashed border-pink-500/30 p-16 flex flex-col items-center gap-4 cursor-pointer hover:border-pink-500/60 transition-all group">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-pink-500/10 group-hover:bg-pink-500/20 transition-all">
            <Star className="w-8 h-8 text-pink-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-white/60">Lista de desejos vazia</p>
            <p className="text-white/25 text-sm mt-1">Adicione o que vocês sonham em ter</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([priority, pItems]) => {
            if (!pItems.length) return null
            const pInfo = priorityInfo(priority)
            return (
              <div key={priority}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${pInfo.color}`}>{pInfo.label}</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="space-y-2">
                  {pItems.map(item => (
                    <div key={item.id} className="glass rounded-2xl border border-white/5 flex items-center gap-3 group hover:border-pink-500/15 transition-all" style={{ padding: '1rem 1rem 1rem 1.5rem' }}>
                      <Gift className="w-5 h-5 text-pink-400/60 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">{item.name}</p>
                        {item.for_who !== 'ambos' && (
                          <p className="text-[11px] text-white/25 mt-0.5">Para: {item.for_who}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-1.5 text-white/20 hover:text-blue-400 transition rounded-lg hover:bg-blue-500/10">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-white/15 hover:text-red-400 transition rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="glass-strong modal-scroll rounded-3xl w-full max-w-md" style={{padding: '1.5rem 1.25rem'}}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black gradient-text text-lg">Novo desejo</h2>
              <button onClick={() => setModal(false)} className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="input-cyber w-full rounded-xl px-4 py-3 text-sm" placeholder="O que vocês desejam? *" />
              <input type="url" value={form.link} onChange={e => setForm(f=>({...f,link:e.target.value}))} className="input-cyber w-full rounded-xl px-4 py-3 text-sm" placeholder="Link (opcional)" />
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Prioridade</p>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => (
                    <button key={p.value} onClick={() => setForm(f=>({...f,priority:p.value}))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${form.priority === p.value ? p.color : 'border-white/10 text-white/30 hover:bg-white/5'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Para quem</p>
                <div className="flex gap-2">
                  {['ambos','eu','par'].map(who => (
                    <button key={who} onClick={() => setForm(f=>({...f,for_who:who}))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all capitalize ${form.for_who === who ? 'btn-neon border-transparent' : 'border-white/10 text-white/30 hover:bg-white/5'}`}>
                      {who === 'ambos' ? '👫 Ambos' : who === 'eu' ? '🙋 Eu' : '💑 Par'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
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
