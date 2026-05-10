import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Upload, Image, X, Loader2, Heart, ZoomIn, Plus, FolderOpen, ArrowLeft, Trash2 } from 'lucide-react'

export default function Gallery() {
  const { couple } = useAuth()
  const [albums, setAlbums] = useState([])
  const [currentAlbum, setCurrentAlbum] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [albumModal, setAlbumModal] = useState(false)
  const [albumName, setAlbumName] = useState('')
  const [savingAlbum, setSavingAlbum] = useState(false)
  const inputRef = useRef()

  useEffect(() => { if (couple) fetchAlbums() }, [couple])

  async function fetchAlbums() {
    setLoading(true)
    const { data } = await supabase
      .from('albums')
      .select('*, gallery(count)')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
    setAlbums(data || [])
    setLoading(false)
  }

  async function fetchPhotos(albumId) {
    setLoading(true)
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false })
    setPhotos(data || [])
    setLoading(false)
  }

  async function handleCreateAlbum() {
    if (!albumName.trim()) return
    setSavingAlbum(true)
    const { data } = await supabase
      .from('albums')
      .insert({ couple_id: couple.id, name: albumName })
      .select()
      .single()
    setSavingAlbum(false)
    setAlbumName('')
    setAlbumModal(false)
    await fetchAlbums()
    if (data) openAlbum(data)
  }

  async function handleDeleteAlbum(album) {
    await supabase.from('albums').delete().eq('id', album.id)
    await fetchAlbums()
  }

  function openAlbum(album) {
    setCurrentAlbum(album)
    fetchPhotos(album.id)
  }

  function goBack() {
    setCurrentAlbum(null)
    setPhotos([])
    fetchAlbums()
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length || !currentAlbum) return
    setUploading(true)

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${couple.id}/${currentAlbum.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('gallery')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(path)
        await supabase.from('gallery').insert({
          couple_id: couple.id,
          album_id: currentAlbum.id,
          url: publicUrl,
          path,
          name: file.name,
        })
      }
    }

    await fetchPhotos(currentAlbum.id)
    setUploading(false)
    inputRef.current.value = ''
  }

  async function handleDeletePhoto(photo) {
    await supabase.storage.from('gallery').remove([photo.path])
    await supabase.from('gallery').delete().eq('id', photo.id)
    setPhotos(p => p.filter(x => x.id !== photo.id))
    if (selected?.id === photo.id) setSelected(null)
  }

  // ── TELA DE ÁLBUNS ──────────────────────────────────────
  if (!currentAlbum) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black gradient-text">Galeria</h1>
            <p className="text-white/30 text-sm mt-1">{albums.length} {albums.length === 1 ? 'álbum' : 'álbuns'}</p>
          </div>
          <button
            onClick={() => setAlbumModal(true)}
            className="btn-neon flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Novo álbum
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          </div>
        ) : albums.length === 0 ? (
          <div
            onClick={() => setAlbumModal(true)}
            className="glass rounded-3xl border border-dashed border-pink-500/30 flex flex-col items-center gap-4 cursor-pointer hover:border-pink-500/60 transition-all group"
            style={{ padding: '4rem 2rem' }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-pink-500/10 group-hover:bg-pink-500/20 transition-all">
              <FolderOpen className="w-8 h-8 text-pink-400" />
            </div>
            <div className="text-center">
              <p className="font-bold text-white/60">Crie seu primeiro álbum</p>
              <p className="text-white/25 text-sm mt-1">Organize suas fotos por momentos</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {albums.map(album => (
              <div
                key={album.id}
                className="group relative glass rounded-2xl border border-white/5 overflow-hidden cursor-pointer hover:border-pink-500/30 transition-all hover:scale-[1.02]"
                onClick={() => openAlbum(album)}
              >
                {/* Cover — placeholder ou futura capa */}
                <div className="h-32 bg-gradient-to-br from-pink-500/10 to-purple-500/10 flex items-center justify-center">
                  <FolderOpen className="w-10 h-10 text-pink-400/40 group-hover:text-pink-400/70 transition-all" />
                </div>
                <div className="p-4">
                  <p className="font-bold text-white text-sm truncate">{album.name}</p>
                  <p className="text-white/30 text-xs mt-0.5">
                    {album.gallery?.[0]?.count ?? 0} fotos
                  </p>
                </div>
                {/* Botão deletar */}
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteAlbum(album) }}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/40 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal novo álbum */}
        {albumModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="glass-strong rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black gradient-text text-lg">Novo álbum</h2>
                <button onClick={() => setAlbumModal(false)} className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={albumName}
                onChange={e => setAlbumName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateAlbum()}
                className="input-cyber w-full rounded-xl px-4 py-3 text-sm"
                placeholder='Ex: "Viagem para SP", "Aniversário"...'
                autoFocus
              />
              <div className="flex gap-3 mt-5">
                <button onClick={() => setAlbumModal(false)} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/40 hover:text-white hover:bg-white/5 transition border border-white/10">
                  Cancelar
                </button>
                <button onClick={handleCreateAlbum} disabled={savingAlbum} className="flex-1 btn-neon py-3 rounded-2xl text-sm font-bold">
                  {savingAlbum ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Criar ♡'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── TELA DE FOTOS DO ÁLBUM ──────────────────────────────
  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-2 text-white/40 hover:text-white transition rounded-xl hover:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black gradient-text">{currentAlbum.name}</h1>
            <p className="text-white/30 text-sm mt-0.5">{photos.length} {photos.length === 1 ? 'foto' : 'fotos'}</p>
          </div>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-neon flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Enviando...' : 'Adicionar'}
        </button>
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleUpload} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="glass rounded-3xl border border-dashed border-pink-500/30 flex flex-col items-center gap-4 cursor-pointer hover:border-pink-500/60 transition-all group"
          style={{ padding: '4rem 2rem' }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-pink-500/10 group-hover:bg-pink-500/20 transition-all">
            <Image className="w-8 h-8 text-pink-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-white/60">Adicione fotos neste álbum</p>
            <p className="text-white/25 text-sm mt-1">Clique para selecionar</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map(photo => (
            <div
              key={photo.id}
              className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-square"
              onClick={() => setSelected(photo)}
            >
              <img src={photo.url} alt={photo.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-5 h-5 text-white" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setSelected(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={selected.url} alt={selected.name} className="w-full rounded-3xl object-contain max-h-[80vh]" />
            <div className="absolute top-3 right-3 flex gap-2">
              <button onClick={() => handleDeletePhoto(selected)} className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl glass border border-white/10 text-white/60 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-3 left-3">
              <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
