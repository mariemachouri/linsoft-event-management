import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import EventCard from '../../components/EventCard/EventCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { eventsService } from '../../services/events.service';
import type { Event } from '../../types';
import './Home.css';

const STATS = [
  { icon: Calendar, value: '100+', label: 'Événements organisés' },
  { icon: Users,    value: '5K+',  label: 'Participants' },
  { icon: MapPin,   value: '10+',  label: 'Villes' },
  { icon: Star,     value: '4.9',  label: 'Note moyenne' },
];

const CATEGORIES = [
  { key: 'CONFERENCE', label: 'Conférences',  emoji: '🎤', color: '#2A3652' },
  { key: 'WORKSHOP',   label: 'Ateliers',     emoji: '🛠️', color: '#3a7bd5' },
  { key: 'WEBINAR',    label: 'Webinaires',   emoji: '💻', color: '#8e44ad' },
  { key: 'TRAINING',   label: 'Formations',   emoji: '📚', color: '#27ae60' },
  { key: 'NETWORKING', label: 'Networking',   emoji: '🤝', color: '#e67e22' },
  { key: 'SEMINAR',    label: 'Séminaires',   emoji: '📊', color: '#FF5276' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [events, setEvents]     = useState<Event[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    eventsService
      .getAll()
      .then((data) => setEvents(data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  // Parallax scroll
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onScroll = () => {
      const y = window.scrollY;
      el.style.backgroundPositionY = `${y * 0.4}px`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const published = events.filter((e) => e.status === 'PUBLISHED');
  const featured  = published.slice(0, 3);
  const trending  = published
    .sort((a, b) => (b.currentParticipants ?? 0) - (a.currentParticipants ?? 0))
    .slice(0, 4);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `/events?q=${encodeURIComponent(search.trim())}`;
    }
  };

  return (
    <main className="home">
      {/* ── Hero ── */}
      <section className="hero" ref={heroRef}>
        {/* Animated blobs */}
        <div className="hero__blob hero__blob--1" />
        <div className="hero__blob hero__blob--2" />
        <div className="hero__blob hero__blob--3" />

        <div className="hero__content">
          <div className="hero__badge">
            <Sparkles size={13} strokeWidth={2.5} />
            <span>La plateforme événementielle professionnelle de LinSoft</span>
          </div>
          <h1 className="hero__title">
            Découvrez
            <br />
            <span className="hero__title-accent">des expériences exceptionnelles</span>
          </h1>
          <p className="hero__subtitle">
            Rejoignez des milliers de professionnels lors des ateliers, conférences, webinaires et événements de networking de LinSoft.
          </p>

          {/* Barre de recherche */}
          <form className="hero__search" onSubmit={handleSearchSubmit}>
            <div className="hero__search-inner">
              <Search size={18} className="hero__search-icon" />
              <input
                type="text"
                placeholder="Rechercher un événement, un thème..."
                className="hero__search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="hero__search-btn">
                Rechercher
              </button>
            </div>
          </form>

          <div className="hero__actions">
            <Link to="/events" className="hero__btn hero__btn--primary">
              Explorer les événements
              <ArrowRight size={16} />
            </Link>
            <Link to="/register" className="hero__btn hero__btn--ghost">
              Créer un compte gratuit
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero__scroll-indicator">
          <div className="hero__scroll-dot" />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats">
        <div className="stats__inner">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="stats__item">
              <div className="stats__icon">
                <Icon size={20} strokeWidth={2} />
              </div>
              <div>
                <div className="stats__value">{value}</div>
                <div className="stats__label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="section">
        <div className="section__inner">
          <div className="section__header">
            <div>
              <p className="section__eyebrow">Parcourir par thème</p>
              <h2 className="section__title">Toutes les catégories</h2>
            </div>
            <Link to="/events" className="section__link">
              Voir tout <ArrowRight size={15} />
            </Link>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.key}
                to={`/events?category=${cat.key}`}
                className="category-card"
                style={{ '--cat-color': cat.color } as React.CSSProperties}
              >
                <span className="category-card__emoji">{cat.emoji}</span>
                <span className="category-card__label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Events ── */}
      <section className="section section--alt">
        <div className="section__inner">
          <div className="section__header">
            <div>
              <p className="section__eyebrow">
                <Zap size={13} /> À la une
              </p>
              <h2 className="section__title">Événements à la une</h2>
            </div>
            <Link to="/events" className="section__link">
              Voir tout <ArrowRight size={15} />
            </Link>
          </div>
          {loading ? (
            <div className="section__loading">
              <LoadingSpinner size="md" text="Chargement des événements…" />
            </div>
          ) : featured.length === 0 ? (
            <div className="section__empty">
              <Calendar size={40} strokeWidth={1.5} />
              <p>Aucun événement publié pour l'instant.</p>
              <Link to="/events" className="btn-primary-sm">Parcourir quand même</Link>
            </div>
          ) : (
            <div className="events-grid events-grid--featured">
              {featured.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Trending ── */}
      {trending.length > 0 && (
        <section className="section">
          <div className="section__inner">
            <div className="section__header">
              <div>
                <p className="section__eyebrow">
                  <TrendingUp size={13} /> Tendance
                </p>
                <h2 className="section__title">Les plus populaires</h2>
              </div>
              <Link to="/events" className="section__link">
                Voir tout <ArrowRight size={15} />
              </Link>
            </div>
            <div className="events-grid">
              {trending.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <div className="cta-banner__inner">
          <div className="cta-banner__content">
            <h2 className="cta-banner__title">Prêt pour votre prochaine expérience ?</h2>
            <p className="cta-banner__subtitle">
              {isAuthenticated
                ? 'Bon retour ! Découvrez et inscrivez-vous aux prochains événements LinSoft.'
                : 'Rejoignez notre communauté et ne manquez aucun événement LinSoft.'}
            </p>
          </div>
          <div className="cta-banner__actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="cta-banner__btn cta-banner__btn--white">
                Mon tableau de bord
              </Link>
            ) : (
              <Link to="/register" className="cta-banner__btn cta-banner__btn--white">
                S'inscrire gratuitement
              </Link>
            )}
            <Link to="/events" className="cta-banner__btn cta-banner__btn--outline">
              Parcourir les événements
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
