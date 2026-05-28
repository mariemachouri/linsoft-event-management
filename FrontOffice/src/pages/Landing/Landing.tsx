import { useNavigate } from 'react-router-dom';
import { Eye, User, Users, ShieldCheck } from 'lucide-react';
import './Landing.css';

const BACKOFFICE_URL = 'http://localhost:4200';
const KEYCLOAK_URL = 'http://localhost:8180';
const KEYCLOAK_REALM = 'event-mgmt';
const BACKOFFICE_CLIENT_ID = 'backoffice-client';

// Logout Keycloak SSO session then redirect to BackOffice.
// Uses the Keycloak 18+ format: post_logout_redirect_uri + client_id.
// IMPORTANT: http://localhost:4200/ must be in backoffice-client's Valid post logout redirect URIs.
const BACKOFFICE_LOGIN_URL =
  `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout` +
  `?post_logout_redirect_uri=${encodeURIComponent(BACKOFFICE_URL + '/')}` +
  `&client_id=${BACKOFFICE_CLIENT_ID}`;

const roles = [
  {
    key: 'visitor',
    label: 'Visiteur',
    description: 'Parcourir les événements',
    icon: Eye,
    color: '#3b82f6',
    action: 'internal',
    path: '/home',
  },
  {
    key: 'participant',
    label: 'Participant',
    description: 'Se connecter et s\'inscrire',
    icon: User,
    color: '#cc1f24',
    action: 'internal',
    path: '/login',
  },
  {
    key: 'organizer',
    label: 'Organisateur',
    description: 'Gérer vos événements',
    icon: Users,
    color: '#f59e0b',
    action: 'external',
    path: BACKOFFICE_LOGIN_URL,
  },
  {
    key: 'admin',
    label: 'Administrateur',
    description: 'Accès complet au système',
    icon: ShieldCheck,
    color: '#10b981',
    action: 'external',
    path: BACKOFFICE_LOGIN_URL,
  },
];

export default function Landing() {
  const navigate = useNavigate();

  const handleSelect = (role: typeof roles[0]) => {
    if (role.action === 'internal') {
      navigate(role.path);
    } else {
      window.location.href = role.path;
    }
  };

  return (
    <div className="landing">
      {/* Background */}
      <div className="landing__bg" />

      {/* Overlay */}
      <div className="landing__overlay" />

      {/* Content */}
      <div className="landing__content">
        {/* Logo + Title */}
        <div className="landing__header">
          <div className="landing__logo">
            <span className="landing__logo-lin">LIN</span>
            <span className="landing__logo-soft">SOFT</span>
          </div>
          <p className="landing__tagline">Your Success, Our Passion</p>
          <h1 className="landing__title">Plateforme de Gestion des Événements</h1>
          <p className="landing__subtitle">Choisissez votre profil pour continuer</p>
        </div>

        {/* Role Cards */}
        <div className="landing__cards">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.key}
                className="landing__card"
                onClick={() => handleSelect(role)}
                style={{ '--card-color': role.color } as React.CSSProperties}
              >
                <div className="landing__card-icon" style={{ background: role.color }}>
                  <Icon size={32} color="#fff" strokeWidth={1.5} />
                </div>
                <span className="landing__card-label">{role.label}</span>
                <span className="landing__card-desc">{role.description}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <p className="landing__footer">
          © 2026 LinSoft — Leader in IT Training &amp; Consulting
        </p>
      </div>
    </div>
  );
}
