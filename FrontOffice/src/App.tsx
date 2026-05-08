import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/Toast/Toast';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Home from './pages/Home/Home';
import Events from './pages/Events/Events';
import EventDetail from './pages/EventDetail/EventDetail';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import NotFound from './pages/NotFound/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/events"     element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/login"      element={<Login />} />
            <Route path="/register"   element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
