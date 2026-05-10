import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Heart } from 'lucide-react'

export default function ProtectedRoute({ children, requireCouple = true }) {
  const { user, couple, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#07060f]">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse-neon" style={{background:'linear-gradient(135deg,#f72585,#7209b7)'}}>
          <Heart className="w-6 h-6 text-white fill-white" />
        </div>
        <div className="w-6 h-6 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!requireCouple && couple) return <Navigate to="/" replace />
  if (requireCouple && !couple) return <Navigate to="/couple-setup" replace />

  return children
}
