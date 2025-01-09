import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { onAuthStateChanged } from '@firebase/auth'
import { auth } from './services/firebase'
import { useAuthStore } from './store/authStore'
import { Login } from './components/auth/Login'
import { PrivateRoute } from './components/auth/PrivateRoute'
import { Header } from './components/layout/Header'
import { TaskView } from './components/tasks/TaskView'
import './App.css'

function App() {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [setUser, setLoading])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <>
                  <Header />
                  <TaskView />
                </>
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
