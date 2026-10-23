import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RouteErrorBoundary } from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import HomeRoute from './components/HomeRoute'
import MainLayout from './components/MainLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UsersListPage from './pages/users/UsersListPage'
import NotFoundPage from './pages/NotFoundPage'

/**
 * Árbol de rutas por módulos:
 *   /login            sesión pública
 *   /register         registro público
 *   /                 Inicio (dashboard)
 *   /users            módulo Usuarios
 *   *                 404
 * Las páginas viven en `src/pages/<modulo>/`; el armazón (barra de módulos,
 * sesión, tema e idioma) es el componente general `MainLayout`.
 */
function App() {
  return (
    <BrowserRouter>
      <RouteErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<HomeRoute />} />
              <Route path="users" element={<UsersListPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </RouteErrorBoundary>
    </BrowserRouter>
  )
}

export default App
