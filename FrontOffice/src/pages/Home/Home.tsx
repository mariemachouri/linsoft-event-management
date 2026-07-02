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
  ChevronDown,
  ShieldCheck,
  Lightbulb,
  BadgeCheck,
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

const PARTNERS = [
  { name: 'Red Hat',     logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Red_Hat_logo.svg' },
  { name: 'IBM',         logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg' },
  { name: 'GitLab',      logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/GitLab_logo.svg' },
  { name: 'AWS',         logo: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg' },
  { name: 'Veeam',       logo: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Veeam_logo.svg' },
  { name: 'Trend Micro', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Trend_Micro_logo.svg' },
  { name: 'Microsoft',   logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg' },
  { name: 'Cisco',       logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg' },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Confiance',
    desc: 'La confiance est le socle de chaque relation et de chaque partenariat que nous construisons avec nos clients et partenaires.',
    color: '#e31e24',
  },
  {
    icon: Lightbulb,
    title: 'Expertise',
    desc: "Notre expertise nous permet d'accompagner efficacement nos clients face aux défis technologiques et organisationnels.",
    color: '#3a7bd5',
  },
  {
    icon: BadgeCheck,
    title: 'Responsabilité',
    desc: 'Nous agissons avec engagement, rigueur et fiabilité dans chacune de nos missions pour garantir des résultats durables.',
    color: '#27ae60',
  },
];

const CATEGORIES = [
  { key: 'CONFERENCE', label: 'Conférences',  emoji: '🎤', color: '#2A3652' },
  { key: 'WORKSHOP',   label: 'Ateliers',     emoji: '🛠️', color: '#3a7bd5' },
  { key: 'WEBINAR',    label: 'Webinaires',   emoji: '💻', color: '#8e44ad' },
  { key: 'TRAINING',   label: 'Formations',   emoji: '📚', color: '#27ae60' },
  { key: 'NETWORKING', label: 'Networking',   emoji: '🤝', color: '#e67e22' },
  { key: 'SEMINAR',    label: 'Séminaires',   emoji: '📊', color: '#FF5276' },
];

const CAT_COLORS: Record<string, string> = {
  CONFERENCE: '#e31e24', WORKSHOP: '#3a7bd5', MEETUP: '#27ae60',
  SEMINAR: '#8e44ad', WEBINAR: '#e67e22', TRAINING: '#f39c12',
};

function HeroEventCard({ event, index }: { event: Event; index: number }) {
  const title    = eventsService.getEventTitle(event);
  const dateStr  = eventsService.formatDate(eventsService.getEventStartDate(event));
  const imgUrl   = eventsService.getImageUrl(event);
  const cat      = event.category || 'EVENT';
  const color    = CAT_COLORS[cat] ?? '#e31e24';
  const pct      = event.maxParticipants
    ? Math.round(((event.currentParticipants ?? 0) / event.maxParticipants) * 100)
    : 0;

  return (
    <Link
      to={`/events/${event.id}`}
      className="hero-event-card"
      style={{ '--card-delay': `${0.4 + index * 0.15}s`, '--card-accent': color } as React.CSSProperties}
    >
      {imgUrl ? (
        <img src={imgUrl} alt={title} className="hero-event-card__img" />
      ) : (
        <div className="hero-event-card__img hero-event-card__img--placeholder"
          style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }} />
      )}
      <div className="hero-event-card__body">
        <span className="hero-event-card__cat" style={{ background: `${color}22`, color }}>
          {cat}
        </span>
        <h3 className="hero-event-card__title">{title}</h3>
        <div className="hero-event-card__meta">
          <span><Calendar size={11} /> {dateStr}</span>
          {event.location && <span><MapPin size={11} /> {event.location.split(',')[0]}</span>}
        </div>
        {event.maxParticipants && (
          <div className="hero-event-card__bar">
            <div className="hero-event-card__bar-track">
              <div className="hero-event-card__bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span>{event.maxParticipants - (event.currentParticipants ?? 0)} places restantes</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [events, setEvents]   = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    eventsService
      .getAll()
      .then((data) => setEvents(data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onScroll = () => {
      el.style.backgroundPositionY = `${window.scrollY * 0.3}px`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const now       = new Date();
  const published = events.filter((e) => e.status === 'PUBLISHED');
  const upcoming  = published.filter((e) => {
    const start = e.startDate || e.startAt;
    return start ? new Date(start) > now : true;
  });
  const heroEvents = upcoming.slice(0, 3);
  const trending   = [...upcoming]
    .sort((a, b) => (b.currentParticipants ?? 0) - (a.currentParticipants ?? 0))
    .slice(0, 4);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `/events?q=${encodeURIComponent(search.trim())}`;
    }
  };

  const scrollToEvents = () => {
    document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="home">

      {/* ── Hero Split ── */}
      <section className="hero" ref={heroRef}>
        {/* Background blobs */}
        <div className="hero__blob hero__blob--1" />
        <div className="hero__blob hero__blob--2" />
        <div className="hero__blob hero__blob--3" />

        {/* Grid lines decoration */}
        <div className="hero__grid" />

        <div className="hero__split">

          {/* LEFT — Text */}
          <div className="hero__left">
            <div className="hero__badge">
              <Sparkles size={13} strokeWidth={2.5} />
              <span>Plateforme événementielle LinSoft</span>
            </div>

            <h1 className="hero__title">
              Vivez des
              <br />
              <span className="hero__title-accent">expériences</span>
              <br />
              <span className="hero__title-accent">inoubliables</span>
            </h1>

            <p className="hero__subtitle">
              Conférences, ateliers, séminaires — découvrez et rejoignez les événements professionnels LinSoft.
            </p>

            <form className="hero__search" onSubmit={handleSearchSubmit}>
              <div className="hero__search-inner">
                <Search size={17} className="hero__search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher un événement..."
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
              {!isAuthenticated && (
                <Link to="/register" className="hero__btn hero__btn--ghost">
                  Créer un compte
                </Link>
              )}
            </div>

            {/* Mini stats */}
            <div className="hero__mini-stats">
              <div className="hero__mini-stat">
                <span className="hero__mini-stat-val">100+</span>
                <span className="hero__mini-stat-lbl">Événements</span>
              </div>
              <div className="hero__mini-stat-divider" />
              <div className="hero__mini-stat">
                <span className="hero__mini-stat-val">5K+</span>
                <span className="hero__mini-stat-lbl">Participants</span>
              </div>
              <div className="hero__mini-stat-divider" />
              <div className="hero__mini-stat">
                <span className="hero__mini-stat-val">4.9★</span>
                <span className="hero__mini-stat-lbl">Note moyenne</span>
              </div>
            </div>
          </div>

          {/* RIGHT — Event cards preview */}
          <div className="hero__right">
            <div className="hero__cards-label">
              <Zap size={13} />
              Événements à la une
            </div>

            {loading ? (
              <div className="hero__cards-loading">
                <LoadingSpinner size="sm" text="" />
              </div>
            ) : heroEvents.length === 0 ? (
              <div className="hero__cards-empty">
                <Calendar size={32} strokeWidth={1.5} />
                <p>Aucun événement disponible</p>
              </div>
            ) : (
              <div className="hero__cards">
                {heroEvents.map((event, i) => (
                  <HeroEventCard key={event.id} event={event} index={i} />
                ))}
                <Link to="/events" className="hero__cards-more">
                  Voir tous les événements <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Scroll hint */}
        <button className="hero__scroll-hint" onClick={scrollToEvents} aria-label="Voir plus">
          <ChevronDown size={20} />
        </button>
      </section>

      {/* ── Stats ── */}
      <section className="stats">
        <div className="stats__inner">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="stats__item">
              <div className="stats__icon"><Icon size={20} strokeWidth={2} /></div>
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
            <Link to="/events" className="section__link">Voir tout <ArrowRight size={15} /></Link>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat) => (
              <Link key={cat.key} to={`/events?category=${cat.key}`} className="category-card"
                style={{ '--cat-color': cat.color } as React.CSSProperties}>
                <span className="category-card__emoji">{cat.emoji}</span>
                <span className="category-card__label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Alliances Stratégiques ── */}
      <section className="partners-section" id="featured">
        <div className="partners-section__header">
          <p className="partners-section__eyebrow">Ils nous font confiance</p>
          <h2 className="partners-section__title">Alliances Stratégiques</h2>
          <div className="partners-section__line" />
        </div>
        <div className="partners-track-wrap">
          <div className="partners-track">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <div key={i} className="partner-logo">
                <img src={p.logo} alt={p.name} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nos Valeurs ── */}
      <section className="values-section">
        <div className="values-section__inner">
          <div className="values-section__header">
            <h2 className="values-section__title">Nos Valeurs</h2>
            <div className="values-section__line" />
          </div>
          <div className="values-grid">
            {VALUES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="value-card" style={{ '--val-color': color } as React.CSSProperties}>
                <div className="value-card__icon-wrap">
                  <Icon size={28} strokeWidth={1.8} />
                </div>
                <h3 className="value-card__title">{title}</h3>
                <p className="value-card__desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending ── */}
      {trending.length > 0 && (
        <section className="section">
          <div className="section__inner">
            <div className="section__header">
              <div>
                <p className="section__eyebrow"><TrendingUp size={13} /> Tendance</p>
                <h2 className="section__title">Les plus populaires</h2>
              </div>
              <Link to="/events" className="section__link">Voir tout <ArrowRight size={15} /></Link>
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
              <Link to="/dashboard" className="cta-banner__btn cta-banner__btn--white">Mon tableau de bord</Link>
            ) : (
              <Link to="/register" className="cta-banner__btn cta-banner__btn--white">S'inscrire gratuitement</Link>
            )}
            <Link to="/events" className="cta-banner__btn cta-banner__btn--outline">Parcourir les événements</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
