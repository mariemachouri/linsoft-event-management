import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogIn, User } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Auth.css';

// URL du BackOffice (Angular) — l'équipe LinSoft (admin / organisateur) y est redirigée
const BACKOFFICE_URL = 'http://localhost:4200';
// Rôles donnant accès au BackOffice (doit rester aligné avec AuthGuard du BackOffice)
const ADMIN_ROLES = ['admin', 'organisateur', 'organizer', 'event-organizer'];

// Décoder les rôles realm depuis le JWT Keycloak
function getRolesFromToken(token: string): string[] {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.realm_access?.roles ?? [];
  } catch {
    return [];
  }
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const from = (location.state as { from?: string })?.from ?? '/home';

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      showToast('warning', 'Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      await login({ username: form.username.trim(), password: form.password });

      // Redirection selon le rôle
      const token = localStorage.getItem('access_token') ?? '';
      const refreshToken = localStorage.getItem('refresh_token') ?? '';
      const roles = getRolesFromToken(token);
      const isTeamMember = roles.some((r) => ADMIN_ROLES.includes(r));

      if (isTeamMember) {
        // Admin / organisateur → BackOffice, avec passage des tokens (pas de form Keycloak)
        showToast('success', 'Connexion réussie ! Redirection vers le BackOffice...');
        const target =
          `${BACKOFFICE_URL}/?access_token=${encodeURIComponent(token)}` +
          `&refresh_token=${encodeURIComponent(refreshToken)}`;
        window.location.href = target;
        return;
      }

      // Participant → FrontOffice
      showToast('success', 'Connexion réussie !');
      navigate(from, { replace: true });
    } catch {
      showToast('error', 'Identifiants incorrects. Vérifiez votre nom d\'utilisateur et mot de passe.');
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
            <img src="/linsoft-white.webp" alt="LinSoft" style={{ height: '48px', width: 'auto', objectFit: 'contain', filter: 'brightness(1.1)' }} />
            <span>Gestion d'événement</span>
          </div>
          <h2 className="auth-brand__tagline">
            La plateforme événementielle professionnelle de LinSoft
          </h2>
          <ul className="auth-brand__features">
            <li>✅ Accédez à 50+ événements professionnels</li>
            <li>✅ Inscrivez-vous en un clic</li>
            <li>✅ Gérez vos inscriptions</li>
            <li>✅ Notifications en temps réel</li>
          </ul>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-panel auth-panel--form">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Connexion</h1>
            <p className="auth-form-subtitle">
              Pas encore de compte ?{' '}
              <Link to="/register" className="auth-link">En créer un</Link>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="auth-field">
              <label className="auth-label">Nom d'utilisateur</label>
              <div className="auth-input-wrap">
                <User size={16} className="auth-input-icon" />
                <input
                  name="username"
                  type="text"
                  className="auth-input"
                  placeholder="ex. john.doe"
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
              <label className="auth-label">Mot de passe</label>
              <div className="auth-input-wrap">
                <Lock size={16} className="auth-input-icon" />
                <input
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  className="auth-input auth-input--has-toggle"
                  placeholder="Votre mot de passe"
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
                  Se connecter
                </>
              )}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <Link to="/events" className="auth-guest-link">
            Parcourir sans compte →
          </Link>
        </div>
      </div>
    </div>
  );
}
