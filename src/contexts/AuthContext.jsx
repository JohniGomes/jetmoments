import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [couple, setCouple] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carrega sessão existente imediatamente (lê do localStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchCouple(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Só reage a login/logout reais — ignora INITIAL_SESSION e TOKEN_REFRESHED
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session.user)
        fetchCouple(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setCouple(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchCouple(userId) {
    const { data, error } = await supabase
      .from('couple_members')
      .select('couple_id, couples(id, name, created_at, invite_code)')
      .eq('user_id', userId)
      .maybeSingle()

    if (!error) {
      setCouple(data?.couples ?? null)
    }
    setLoading(false)
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
