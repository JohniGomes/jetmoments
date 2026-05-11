import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Plus, BookOpen, Trash2, X, Loader2, Heart, Calendar, Send } from 'lucide-react'

const EMOJIS = ['❤️', '😂', '😢', '🔥', '😍']

export default function Notes() {
  const { couple, user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)
  const [reactions, setReactions] = useState([])   // [{note_id, user_id, emoji}]
  const [replies, setReplies] = useState([])        // [{id, note_id, author_id, content, created_at}]
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const replyEndRef = useRef()

  useEffect(() => { if (couple) fetchNotes(); else setLoading(false) }, [couple])

  async function fetchNotes() {
    setLoading(true)
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)

    // Busca todas as reações do casal de uma vez
    if (data?.length) {
      const ids = data.map(n => n.id)
      const { data: rxs } = await supabase
        .from('note_reactions')
        .select('note_id, user_id, emoji')
        .in('note_id', ids)
      setReactions(rxs || [])
    }
  }

  async function openNote(note) {
    setSelected(note)
    setReplyText('')
    const { data } = await supabase
      .from('note_replies')
      .select('*')
      .eq('note_id', note.id)
      .order('created_at', { ascending: true })
    setReplies(data || [])
    setTimeout(() => replyEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
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

  async function toggleReaction(noteId, emoji) {
    const existing = reactions.find(r => r.note_id === noteId && r.user_id === user.id && r.emoji === emoji)
    if (existing) {
      await supabase.from('note_reactions').delete()
        .eq('note_id', noteId).eq('user_id', user.id).eq('emoji', emoji)
      setReactions(r => r.filter(x => !(x.note_id === noteId && x.user_id === user.id && x.emoji === emoji)))
    } else {
      await supabase.from('note_reactions').insert({ note_id: noteId, user_id: user.id, couple_id: couple.id, emoji })
      setReactions(r => [...r, { note_id: noteId, user_id: user.id, emoji }])
    }
  }

  async function handleSendReply() {
    if (!replyText.trim() || !selected) return
    setSendingReply(true)
    const { data } = await supabase.from('note_replies').insert({
      note_id: selected.id,
      author_id: user.id,
      couple_id: couple.id,
      content: replyText.trim(),
    }).select().single()
    if (data) {
      setReplies(r => [...r, data])
      setReplyText('')
      setTimeout(() => replyEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    setSendingReply(false)
  }

  function noteReactions(noteId) {
    const rx = reactions.filter(r => r.note_id === noteId)
    const grouped = {}
    rx.forEach(r => { grouped[r.emoji] = (grouped[r.emoji] || 0) + 1 })
    return grouped
  }

  function myReaction(noteId, emoji) {
    return reactions.some(r => r.note_id === noteId && r.user_id === user.id && r.emoji === emoji)
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
          {notes.map((note, i) => {
            const rx = noteReactions(note.id)
            const hasRx = Object.keys(rx).length > 0
            return (
              <div
                key={note.id}
                onClick={() => openNote(note)}
                className={`glass rounded-2xl border bg-gradient-to-br ${colors[i % colors.length]} cursor-pointer hover:scale-[1.02] transition-all duration-200 active:scale-95`}
                style={{ padding: '1.25rem 1rem 1rem 1.25rem' }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-white text-sm leading-tight line-clamp-2">{note.title}</h3>
                  <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400 flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-white/40 text-xs leading-relaxed line-clamp-3">{note.content}</p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-white/20" />
                    <span className="text-[10px] text-white/20">
                      {new Date(note.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {hasRx && (
                    <div className="flex gap-0.5">
                      {Object.entries(rx).map(([emoji, count]) => (
                        <span key={emoji} className="text-xs">{emoji}{count > 1 ? <span className="text-[10px] text-white/40 ml-0.5">{count}</span> : ''}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nova nota */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="glass-strong modal-scroll rounded-3xl w-full max-w-lg" style={{padding: '1.75rem 1.5rem'}}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black gradient-text text-lg">Nova nota</h2>
              <button onClick={() => setModal(false)} className="p-2 text-white/30 hover:text-white transition rounded-xl hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col" style={{gap: '1.25rem'}}>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="input-cyber w-full rounded-xl text-sm font-bold"
                placeholder="Título da nota..."
              />
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className="input-cyber w-full rounded-xl text-sm resize-none"
                placeholder="Escreva aqui sua memória, pensamento ou carta..."
                rows={6}
              />
            </div>
            <div style={{marginTop: "2rem"}} className="flex gap-3">
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

      {/* Modal leitura + reações + respostas */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-strong rounded-3xl w-full max-w-lg flex flex-col" style={{maxHeight: '88vh'}}>

            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-6 pb-4 flex-shrink-0">
              <h2 className="font-black text-white text-xl leading-tight">{selected.title}</h2>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleDelete(selected.id)} className="p-2 text-red-400/60 hover:text-red-400 transition rounded-xl hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelected(null)} className="p-2 text-white/30 hover:text-white transition rounded-xl hover:bg-white/5">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conteúdo + respostas — scrollable */}
            <div className="overflow-y-auto flex-1 px-6">
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{selected.content}</p>

              <div className="flex items-center gap-1.5 mt-4 pb-4 border-b border-white/5">
                <Calendar className="w-3 h-3 text-white/20" />
                <span className="text-[11px] text-white/20">
                  {new Date(selected.created_at).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Respostas */}
              {replies.length > 0 && (
                <div className="py-4 flex flex-col gap-3">
                  {replies.map(reply => {
                    const isMe = reply.author_id === user.id
                    return (
                      <div key={reply.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                          style={{
                            background: isMe
                              ? 'linear-gradient(135deg, rgba(247,37,133,0.25), rgba(181,23,158,0.2))'
                              : 'rgba(255,255,255,0.06)',
                            border: isMe ? '1px solid rgba(247,37,133,0.2)' : '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <p className="text-white/80 leading-relaxed">{reply.content}</p>
                          <p className="text-[10px] text-white/20 mt-1 text-right">
                            {new Date(reply.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={replyEndRef} />
                </div>
              )}
              {replies.length === 0 && <div ref={replyEndRef} />}
            </div>

            {/* Reações */}
            <div className="px-6 py-3 border-t border-white/5 flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-white/20 mr-1">Reagir:</span>
              {EMOJIS.map(emoji => {
                const count = reactions.filter(r => r.note_id === selected.id && r.emoji === emoji).length
                const mine = myReaction(selected.id, emoji)
                return (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction(selected.id, emoji)}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl text-sm transition-all"
                    style={{
                      background: mine ? 'rgba(247,37,133,0.2)' : 'rgba(255,255,255,0.05)',
                      border: mine ? '1px solid rgba(247,37,133,0.3)' : '1px solid rgba(255,255,255,0.07)',
                      transform: mine ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {emoji}{count > 0 && <span className="text-[11px] text-white/50">{count}</span>}
                  </button>
                )
              })}
            </div>

            {/* Campo de resposta */}
            <div className="px-4 pb-4 flex-shrink-0">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                  className="input-cyber flex-1 rounded-2xl text-sm"
                  style={{padding: '10px 14px'}}
                  placeholder="Responder..."
                />
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="p-3 rounded-2xl transition-all flex-shrink-0"
                  style={{background: replyText.trim() ? 'linear-gradient(135deg,#f72585,#b5179e)' : 'rgba(255,255,255,0.05)'}}
                >
                  {sendingReply
                    ? <Loader2 className="w-4 h-4 animate-spin text-white" />
                    : <Send className="w-4 h-4 text-white" />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
