import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [couple, setCouple] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setCouple(null)
        setLoading(false)
        return
      }
      setUser(session.user)
      fetchCouple(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchCouple(userId) {
    const { data } = await supabase
      .from('couple_members')
      .select('couple_id, couples(id, name, created_at, invite_code)')
      .eq('user_id', userId)
      .maybeSingle()

    setCouple(data?.couples ?? null)
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
