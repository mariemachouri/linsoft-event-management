import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogIn, User } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const from = (location.state as { from?: string })?.from ?? '/';

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      showToast('warning', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await login({ username: form.username.trim(), password: form.password });
      showToast('success', 'Login successful!');
      navigate(from, { replace: true });
    } catch {
      showToast('error', 'Invalid credentials. Please check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-panel auth-panel--brand">
        <div className="auth-brand">
          <div className="auth-brand__logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
              <rect width="48" height="48" rx="12" fill="#FF5276"/>
              <path d="M14 34V14l10 10 10-10v20" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Event Management</span>
          </div>
          <h2 className="auth-brand__tagline">
            LinSoft’s professional event platform
          </h2>
          <ul className="auth-brand__features">
            <li>✅ Access 50+ professional events</li>
            <li>✅ Register in one click</li>
            <li>✅ Manage your registrations</li>
            <li>✅ Real-time notifications</li>
          </ul>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-panel auth-panel--form">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Sign In</h1>
            <p className="auth-form-subtitle">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">Create one</Link>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="auth-field">
              <label className="auth-label">Username</label>
              <div className="auth-input-wrap">
                <User size={16} className="auth-input-icon" />
                <input
                  name="username"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. john.doe"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <Lock size={16} className="auth-input-icon" />
                <input
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  className="auth-input auth-input--has-toggle"
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <Link to="/events" className="auth-guest-link">
            Browse without an account →
          </Link>
        </div>
      </div>
    </div>
  );
}
