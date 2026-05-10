import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Plus, List, Trash2, X, Loader2, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react'

const ICONS = ['🎬','🍕','🏃','🎲','🌊','🏕️','🎵','✈️','🎨','🧁','🏖️','🎡']

export default function Lists() {
  const { couple } = useAuth()
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [itemModal, setItemModal] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [form, setForm] = useState({ title: '', icon: '🎬' })
  const [itemForm, setItemForm] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (couple) fetchLists() }, [couple])

  async function fetchLists() {
    setLoading(true)
    const { data } = await supabase
      .from('lists')
      .select('*, list_items(*)')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
    setLists(data || [])
    setLoading(false)
  }

  async function handleSaveList() {
    if (!form.title.trim()) return
    setSaving(true)
    await supabase.from('lists').insert({ couple_id: couple.id, title: form.title, icon: form.icon })
    await fetchLists()
    setForm({ title: '', icon: '🎬' })
    setModal(false)
    setSaving(false)
  }

  async function handleAddItem(listId) {
    if (!itemForm.trim()) return
    await supabase.from('list_items').insert({ list_id: listId, text: itemForm })
    setItemForm('')
    setItemModal(null)
    await fetchLists()
  }

  async function toggleItem(item) {
    await supabase.from('list_items').update({ done: !item.done }).eq('id', item.id)
    await fetchLists()
  }

  async function deleteList(id) {
    await supabase.from('lists').delete().eq('id', id)
    setLists(l => l.filter(x => x.id !== id))
    if (expanded === id) setExpanded(null)
  }

  async function deleteItem(id, listId) {
    await supabase.from('list_items').delete().eq('id', id)
    setLists(l => l.map(list => list.id === listId
      ? { ...list, list_items: list.list_items.filter(i => i.id !== id) }
      : list
    ))
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black gradient-text">Listas de Rolê</h1>
          <p className="text-white/30 text-sm mt-1">{lists.length} {lists.length === 1 ? 'lista' : 'listas'}</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-neon flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap">
          <Plus className="w-4 h-4" /> Nova lista
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>
      ) : lists.length === 0 ? (
        <div onClick={() => setModal(true)} className="glass rounded-3xl border border-dashed border-pink-500/30 p-16 flex flex-col items-center gap-4 cursor-pointer hover:border-pink-500/60 transition-all group">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-pink-500/10 group-hover:bg-pink-500/20 transition-all">
            <List className="w-8 h-8 text-pink-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-white/60">Crie sua primeira lista</p>
            <p className="text-white/25 text-sm mt-1">Filmes, rolês, viagens, o que quiser!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map(list => {
            const done = list.list_items?.filter(i => i.done).length || 0
            const total = list.list_items?.length || 0
            const isExpanded = expanded === list.id
            return (
              <div key={list.id} className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div
                  className="flex items-center gap-3 cursor-pointer hover:bg-white/3 transition" style={{ padding: '1rem 1rem 1rem 1.5rem' }}
                  onClick={() => setExpanded(isExpanded ? null : list.id)}
                >
                  <span className="text-2xl">{list.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{list.title}</p>
                    <p className="text-[11px] text-white/30">{done}/{total} concluídos</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); setItemModal(list.id) }} className="p-1.5 text-white/30 hover:text-pink-400 transition rounded-lg hover:bg-pink-500/10">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteList(list.id) }} className="p-1.5 text-white/15 hover:text-red-400 transition rounded-lg hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                  </div>
                </div>

                {/* Progress bar */}
                {total > 0 && (
                  <div className="px-4 pb-1">
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(done/total)*100}%`, background: 'linear-gradient(90deg,#f72585,#7209b7)' }} />
                    </div>
                  </div>
                )}

                {/* Items */}
                {isExpanded && (
                  <div className="pb-4 pt-2 space-y-2 border-t border-white/5 mt-2" style={{ paddingLeft: '1.5rem', paddingRight: '1rem' }}>
                    {list.list_items?.length === 0 && (
                      <p className="text-xs text-white/25 text-center py-2">Nenhum item ainda. Adicione acima!</p>
                    )}
                    {list.list_items?.map(item => (
                      <div key={item.id} className="flex items-center gap-3 group">
                        <button onClick={() => toggleItem(item)} className="flex-shrink-0">
                          {item.done
                            ? <CheckCircle2 className="w-5 h-5 text-pink-400 drop-shadow-[0_0_4px_rgba(247,37,133,0.6)]" />
                            : <Circle className="w-5 h-5 text-white/20 hover:text-pink-400 transition" />
                          }
                        </button>
                        <span className={`flex-1 text-sm ${item.done ? 'line-through text-white/25' : 'text-white/70'}`}>{item.text}</span>
                        <button onClick={() => deleteItem(item.id, list.id)} className="opacity-0 group-hover:opacity-100 p-1 text-white/15 hover:text-red-400 transition rounded-lg">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nova lista */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-strong rounded-3xl w-full max-w-md" style={{padding: '1.5rem 1.25rem'}}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black gradient-text text-lg">Nova lista</h2>
              <button onClick={() => setModal(false)} className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="input-cyber w-full rounded-xl px-4 py-3 text-sm" placeholder="Nome da lista *" />
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Ícone</p>
                <div className="grid grid-cols-6 gap-2">
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => setForm(f => ({...f, icon}))} className={`text-2xl p-2 rounded-xl transition-all ${form.icon === icon ? 'bg-pink-500/20 border border-pink-500/40 scale-110' : 'hover:bg-white/5'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(false)} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/40 hover:text-white hover:bg-white/5 transition border border-white/10">Cancelar</button>
              <button onClick={handleSaveList} disabled={saving} className="flex-1 btn-neon py-3 rounded-2xl text-sm font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Criar ♡'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal adicionar item */}
      {itemModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-strong rounded-3xl w-full max-w-md" style={{padding: '1.5rem 1.25rem'}}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black gradient-text text-lg">Novo item</h2>
              <button onClick={() => setItemModal(null)} className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition"><X className="w-4 h-4" /></button>
            </div>
            <input
              type="text"
              value={itemForm}
              onChange={e => setItemForm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddItem(itemModal)}
              className="input-cyber w-full rounded-xl px-4 py-3 text-sm"
              placeholder="Ex: La Casa de Papel..."
              autoFocus
            />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setItemModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/40 hover:text-white hover:bg-white/5 transition border border-white/10">Cancelar</button>
              <button onClick={() => handleAddItem(itemModal)} className="flex-1 btn-neon py-3 rounded-2xl text-sm font-bold">Adicionar ♡</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
