import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import './Footer.css';

const OFFICES = [
  {
    flag: '/flags/tn.svg',
    country: 'Tunisie',
    address: '05 Rue Omar Khayem, Immeuble ZAHRA, Zone d\'activité La Goulette-Lac 3 Tunis, 2060',
    mapsUrl: 'https://maps.google.com/?q=La+Goulette+Tunis',
    phone: '+216 31 332 200',
  },
  {
    flag: '/flags/ma.svg',
    country: 'Maroc',
    address: '1er étage, Florida, Centre Park, Bureau N°15, 2 Bd Zoulikha Nasri, Casablanca, Maroc',
    mapsUrl: 'https://maps.google.com/?q=Casablanca+Maroc',
    phone: '+212 52 25 84 021',
  },
  {
    flag: '/flags/dz.svg',
    country: 'Algérie',
    address: 'Business Center, Techno Parc Sidi Abdellah, Alger, Algérie',
    mapsUrl: 'https://maps.google.com/?q=Techno+Parc+Sidi+Abdellah+Alger',
    phone: '+213 (0) 661 50 59 50',
  },
  {
    flag: '/flags/ly.svg',
    country: 'Libye',
    address: '02, rue Hawata, HI Andalus, Tripoli, Libye',
    mapsUrl: 'https://maps.google.com/?q=Tripoli+Libye',
    phone: '+218 94 347 6060',
  },
];

const QUICK_LINKS_COL1 = [
  { label: 'Accueil',    to: '/' },
  { label: 'Ressources', to: '/events' },
  { label: 'Carrières',  to: '#' },
];

const QUICK_LINKS_COL2 = [
  { label: 'À propos',    to: '#' },
  { label: 'Événements',  to: '/events' },
  { label: 'Contact',     to: '#' },
];

const SOCIALS = [
  { icon: Linkedin,  label: 'LinkedIn',  href: 'https://www.linkedin.com/company/linsoft' },
  { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/linsoft' },
  { icon: Facebook,  label: 'Facebook',  href: 'https://www.facebook.com/linsoft' },
  { icon: Youtube,   label: 'YouTube',   href: 'https://www.youtube.com/@linsoft' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">

      {/* ── Top Row : Logo · Links · Socials ── */}
      <div className="footer__top">
        <div className="footer__top-inner">

          {/* Logo */}
          <div className="footer__brand">
            <Link to="/">
              <img src="/linsoft-white.webp" alt="LinSoft" className="footer__logo-img" />
            </Link>
          </div>

          {/* Liens rapides */}
          <div className="footer__links-block">
            <h4 className="footer__block-title">Liens Rapides</h4>
            <div className="footer__links-cols">
              <ul className="footer__links-list">
                {QUICK_LINKS_COL1.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to}>{l.label}</Link>
                  </li>
                ))}
              </ul>
              <ul className="footer__links-list">
                {QUICK_LINKS_COL2.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suivez-nous */}
          <div className="footer__social-block">
            <h4 className="footer__block-title">Suivez-nous</h4>
            <div className="footer__social-row">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="footer__social-btn"
                  aria-label={label}
                >
                  <Icon size={17} strokeWidth={1.8} />
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Divider ── */}
      <div className="footer__divider" />

      {/* ── Offices ── */}
      <div className="footer__offices">
        <div className="footer__offices-inner">
          <h3 className="footer__offices-title">Nos Bureaux</h3>
          <div className="footer__offices-grid">
            {OFFICES.map((o) => (
              <div key={o.country} className="office-card">
                <div className="office-card__header">
                  <img src={o.flag} alt={o.country} className="office-card__flag" />
                  <span className="office-card__country">{o.country}</span>
                </div>
                <p className="office-card__address">{o.address}</p>
                <a
                  href={o.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="office-card__map-link"
                >
                  <MapPin size={13} />
                  Voir sur la carte
                </a>
                <div className="office-card__contact">
                  <span className="office-card__contact-item">
                    <Phone size={13} />
                    {o.phone}
                  </span>
                  <span className="office-card__contact-item">
                    <Mail size={13} />
                    contact@linsoft.com
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="footer__divider" />
      <div className="footer__bottom">
        <span>© {year} LinSoft — Tous droits réservés</span>
      </div>

    </footer>
  );
}
