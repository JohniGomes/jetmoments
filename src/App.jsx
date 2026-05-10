import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import Gallery from './pages/gallery/Gallery'
import Notes from './pages/notes/Notes'
import Places from './pages/places/Places'
import Lists from './pages/lists/Lists'
import Wishlist from './pages/wishlist/Wishlist'
import Music from './pages/music/Music'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="notes" element={<Notes />} />
            <Route path="places" element={<Places />} />
            <Route path="lists" element={<Lists />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="music" element={<Music />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
