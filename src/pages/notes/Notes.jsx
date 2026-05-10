import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Plus, BookOpen, Trash2, X, Loader2, Heart, Calendar } from 'lucide-react'

export default function Notes() {
  const { couple, user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (couple) fetchNotes() }, [couple])

  async function fetchNotes() {
    setLoading(true)
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    await supabase.from('notes').insert({
      couple_id: couple.id,
      author_id: user.id,
      title: form.title,
      content: form.content,
    })
    await fetchNotes()
    setForm({ title: '', content: '' })
    setModal(false)
    setSaving(false)
  }

  async function handleDelete(id) {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(n => n.filter(x => x.id !== id))
    setSelected(null)
  }

  const colors = [
    'from-pink-500/15 to-rose-500/5 border-pink-500/20',
    'from-purple-500/15 to-violet-500/5 border-purple-500/20',
    'from-blue-500/15 to-cyan-500/5 border-blue-500/20',
    'from-amber-500/15 to-yellow-500/5 border-amber-500/20',
    'from-emerald-500/15 to-teal-500/5 border-emerald-500/20',
  ]

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black gradient-text">Notas & Diário</h1>
          <p className="text-white/30 text-sm mt-1">{notes.length} {notes.length === 1 ? 'nota' : 'notas'}</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-header">
          <Plus className="w-4 h-4" /> Nova nota
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div
          onClick={() => setModal(true)}
          className="glass rounded-3xl border border-dashed border-pink-500/30 p-16 flex flex-col items-center gap-4 cursor-pointer hover:border-pink-500/60 transition-all group"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-pink-500/10 group-hover:bg-pink-500/20 transition-all">
            <BookOpen className="w-8 h-8 text-pink-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-white/60">Escreva sua primeira nota</p>
            <p className="text-white/25 text-sm mt-1">Cartas, pensamentos, memórias...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {notes.map((note, i) => (
            <div
              key={note.id}
              onClick={() => setSelected(note)}
              className={`glass rounded-2xl border bg-gradient-to-br ${colors[i % colors.length]} cursor-pointer hover:scale-[1.02] transition-all duration-200 active:scale-95`} style={{ padding: '1.25rem 1rem 1.25rem 1.25rem' }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-bold text-white text-sm leading-tight line-clamp-2">{note.title}</h3>
                <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400 flex-shrink-0 mt-0.5" />
              </div>
              <p className="text-white/40 text-xs leading-relaxed line-clamp-3">{note.content}</p>
              <div className="flex items-center gap-1.5 mt-4">
                <Calendar className="w-3 h-3 text-white/20" />
                <span className="text-[10px] text-white/20">
                  {new Date(note.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nova nota */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="glass-strong modal-scroll rounded-3xl w-full max-w-lg" style={{padding: '1.5rem 1.25rem'}}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black gradient-text text-lg">Nova nota</h2>
              <button onClick={() => setModal(false)} className="p-2 text-white/30 hover:text-white transition rounded-xl hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="input-cyber w-full rounded-xl px-4 py-3 text-sm font-bold"
                placeholder="Título da nota..."
              />
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className="input-cyber w-full rounded-xl px-4 py-3 text-sm resize-none"
                placeholder="Escreva aqui sua memória, pensamento ou carta..."
                rows={6}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(false)} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/40 hover:text-white hover:bg-white/5 transition border border-white/10">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 btn-neon py-3 rounded-2xl text-sm font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Salvar ♡'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal leitura */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="glass-strong rounded-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-5">
              <h2 className="font-black text-white text-xl">{selected.title}</h2>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleDelete(selected.id)} className="p-2 text-red-400/60 hover:text-red-400 transition rounded-xl hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelected(null)} className="p-2 text-white/30 hover:text-white transition rounded-xl hover:bg-white/5">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{selected.content}</p>
            <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-white/5">
              <Calendar className="w-3 h-3 text-white/20" />
              <span className="text-[11px] text-white/20">
                {new Date(selected.created_at).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
