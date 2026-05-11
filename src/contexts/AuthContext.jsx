import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const COUPLE_KEY = 'jtm_couple'

function getCachedCouple() {
  try { return JSON.parse(localStorage.getItem(COUPLE_KEY)) } catch { return null }
}
function setCachedCouple(data) {
  if (data) localStorage.setItem(COUPLE_KEY, JSON.stringify(data))
  else localStorage.removeItem(COUPLE_KEY)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [couple, setCouple] = useState(getCachedCouple) // carrega cache instantâneo
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setCouple(null)
        setCachedCouple(null)
        setLoading(false)
        return
      }
      setUser(session.user)
      fetchCouple(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchCouple(userId) {
    const cached = getCachedCouple()
    if (cached) {
      setCouple(cached)
      setLoading(false)
    }

    try {
      const { data: members, error: membersErr } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('user_id', userId)
        .limit(1)

      // Se a query falhou (RLS ou rede), mantém o cache — não limpa
      if (membersErr) { setLoading(false); return }

      const member = members?.[0]

      // Sem row: só limpa se não tinha cache (usuário realmente sem casal)
      if (!member?.couple_id) {
        if (!cached) { setCachedCouple(null); setCouple(null) }
        setLoading(false)
        return
      }

      const { data: coupleData } = await supabase
        .from('couples')
        .select('id, name, created_at, invite_code')
        .eq('id', member.couple_id)
        .maybeSingle()

      if (coupleData) {
        setCachedCouple(coupleData)
        setCouple(coupleData)
      }
    } catch {
      // erro de rede — mantém o cache
    } finally {
      setLoading(false)
    }
  }

  function updateCouple(data) {
    setCachedCouple(data)
    setCouple(data)
  }

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, couple, setCouple: updateCouple, loading, signUp, signIn, signOut, fetchCouple }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
