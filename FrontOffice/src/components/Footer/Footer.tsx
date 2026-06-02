import { Link } from 'react-router-dom';
import { Calendar, Github, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        {/* Brand */}
        <div className="footer__brand">
          <Link to="/" className="footer__logo">
            <div className="footer__logo-icon">
              <Calendar size={18} strokeWidth={2.5} />
            </div>
            <div className="footer__logo-text">
              <span>Event<span className="footer__logo-accent">Management</span></span>
              <small className="footer__logo-by">by LinSoft</small>
            </div>
          </Link>
          <p className="footer__tagline">
            Découvrez, rejoignez et progressez avec les événements professionnels LinSoft — ateliers, conférences, webinaires et plus.
          </p>
          <div className="footer__socials">
            <a href="#" className="footer__social-btn" aria-label="LinkedIn">
              <Linkedin size={16} />
            </a>
            <a href="#" className="footer__social-btn" aria-label="GitHub">
              <Github size={16} />
            </a>
            <a href="mailto:contact@linsoft.com" className="footer__social-btn" aria-label="Email">
              <Mail size={16} />
            </a>
          </div>
        </div>

        {/* Navigation */}
        <div className="footer__section">
          <h4 className="footer__section-title">Navigation</h4>
          <ul className="footer__links">
            <li><Link to="/">Accueil</Link></li>
            <li><Link to="/events">Événements</Link></li>
            <li><Link to="/dashboard">Mes inscriptions</Link></li>
            <li><Link to="/profile">Mon profil</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer__section">
          <h4 className="footer__section-title">Contact</h4>
          <ul className="footer__contact-list">
            <li>
              <MapPin size={14} />
              <span>Algiers, Algeria</span>
            </li>
            <li>
              <Phone size={14} />
              <span>+213 (0) 23 456 789</span>
            </li>
            <li>
              <Mail size={14} />
              <span>contact@linsoft.com</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer__bottom">
        <span>© {year} Event Management — Powered by</span>
        <a href="https://www.linsoft.com" target="_blank" rel="noreferrer" className="footer__linsoft-link">
          LinSoft
        </a>
        <span>· Tous droits réservés</span>
      </div>
    </footer>
  );
}
