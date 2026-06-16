import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Calendar, ChevronDown, LogOut, Menu, User, X, Bell, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/home', label: 'Accueil' },
  { to: '/events', label: 'Événements' },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll detection for transparent → solid navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate('/');
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || user.username?.[0]?.toUpperCase()
    : '';

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        {/* Landing page button */}
        <Link to="/" className="navbar__landing-btn" title="Retour à l'accueil" onClick={() => setMenuOpen(false)}>
          <LayoutGrid size={16} />
        </Link>

        {/* Logo */}
        <Link to="/home" className="navbar__logo" onClick={() => setMenuOpen(false)}>
          <img src="/linsoft-white.webp" alt="LinSoft" className="navbar__logo-img" />
          <div className="navbar__logo-text">
            <span className="navbar__logo-main">Gestion d'<span className="navbar__logo-accent">évènements</span></span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar__nav">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `navbar__nav-link${isActive ? ' navbar__nav-link--active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="navbar__actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="navbar__icon-btn" title="Mes inscriptions">
                <Bell size={18} />
              </Link>
              <div className="navbar__user-menu" ref={dropdownRef}>
                <button
                  className="navbar__user-btn"
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-expanded={dropdownOpen}
                >
                  <div className="navbar__avatar">
                    {user?.avatarUrl
                      ? <img src={user.avatarUrl} alt="avatar" className="navbar__avatar-img" />
                      : initials}
                  </div>
                  <span className="navbar__username">{user?.firstName}</span>
                  <ChevronDown
                    size={14}
                    className={`navbar__chevron${dropdownOpen ? ' navbar__chevron--open' : ''}`}
                  />
                </button>
                {dropdownOpen && (
                  <div className="navbar__dropdown">
                    <div className="navbar__dropdown-header">
                      <div className="navbar__dropdown-avatar">
                        {user?.avatarUrl
                          ? <img src={user.avatarUrl} alt="avatar" className="navbar__avatar-img" />
                          : initials}
                      </div>
                      <div>
                        <div className="navbar__dropdown-name">
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div className="navbar__dropdown-email">{user?.email}</div>
                      </div>
                    </div>
                    <div className="navbar__dropdown-divider" />
                    <Link
                      to="/dashboard"
                      className="navbar__dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Calendar size={15} /> Mes événements
                    </Link>
                    <Link
                      to="/profile"
                      className="navbar__dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User size={15} /> Mon profil
                    </Link>
                    <div className="navbar__dropdown-divider" />
                    <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={handleLogout}>
                      <LogOut size={15} /> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__btn navbar__btn--ghost">
                Connexion
              </Link>
              <Link to="/register" className="navbar__btn navbar__btn--primary">
                S'inscrire
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`navbar__mobile${menuOpen ? ' navbar__mobile--open' : ''}`}>
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `navbar__mobile-link${isActive ? ' navbar__mobile-link--active' : ''}`
            }
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </NavLink>
        ))}
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>
              Mes inscriptions
            </Link>
            <Link to="/profile" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>
              Mon profil
            </Link>
            <button className="navbar__mobile-logout" onClick={handleLogout}>
              <LogOut size={15} /> Déconnexion
            </button>
          </>
        ) : (
          <div className="navbar__mobile-actions">
            <Link to="/login" className="navbar__btn navbar__btn--ghost" onClick={() => setMenuOpen(false)}>
              Connexion
            </Link>
            <Link to="/register" className="navbar__btn navbar__btn--primary" onClick={() => setMenuOpen(false)}>
              S'inscrire
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
