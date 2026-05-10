import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [couple, setCouple] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // onAuthStateChange é a única fonte de verdade.
    // INITIAL_SESSION dispara imediatamente com a sessão atual (ou null).
    // TOKEN_REFRESHED dispara quando o JWT expira e é renovado.
    // Em ambos os casos, refazemos o fetchCouple.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setCouple(null)
        setLoading(false)
        return
      }

      if (!session?.user) {
        setUser(null)
        setCouple(null)
        setLoading(false)
        return
      }

      // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED — todos buscam o casal
      setUser(session.user)
      fetchCouple(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchCouple(userId) {
    try {
      // Passo 1: busca o couple_id do usuário
      const { data: member, error: memberError } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (memberError) throw memberError
      if (!member?.couple_id) {
        setCouple(null)
        setLoading(false)
        return
      }

      // Passo 2: busca os dados do casal diretamente
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id, name, created_at, invite_code')
        .eq('id', member.couple_id)
        .maybeSingle()

      if (coupleError) throw coupleError
      setCouple(coupleData ?? null)
    } catch {
      // Erro de rede ou JWT expirado — TOKEN_REFRESHED vai retentar
    } finally {
      setLoading(false)
    }
  }

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
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
    <AuthContext.Provider value={{ user, couple, setCouple, loading, signUp, signIn, signOut, fetchCouple }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
