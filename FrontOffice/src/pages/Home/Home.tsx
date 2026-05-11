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
  { icon: Calendar, value: '100+', label: 'Events Organized' },
  { icon: Users,    value: '5K+',  label: 'Participants' },
  { icon: MapPin,   value: '10+',  label: 'Cities' },
  { icon: Star,     value: '4.9',  label: 'Average Rating' },
];

const CATEGORIES = [
  { key: 'CONFERENCE', label: 'Conferences',  emoji: '🎤', color: '#2A3652' },
  { key: 'WORKSHOP',   label: 'Workshops',    emoji: '🛠️', color: '#3a7bd5' },
  { key: 'WEBINAR',    label: 'Webinars',     emoji: '💻', color: '#8e44ad' },
  { key: 'TRAINING',   label: 'Trainings',    emoji: '📚', color: '#27ae60' },
  { key: 'NETWORKING', label: 'Networking',   emoji: '🤝', color: '#e67e22' },
  { key: 'SEMINAR',    label: 'Seminars',     emoji: '📊', color: '#FF5276' },
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
            <span>LinSoft's Professional Event Platform</span>
          </div>
          <h1 className="hero__title">
            Discover
            <br />
            <span className="hero__title-accent">exceptional experiences</span>
          </h1>
          <p className="hero__subtitle">
            Join thousands of professionals at LinSoft’s expert-led workshops, conferences, webinars and networking events.
          </p>

          {/* Search Bar */}
          <form className="hero__search" onSubmit={handleSearchSubmit}>
            <div className="hero__search-inner">
              <Search size={18} className="hero__search-icon" />
              <input
                type="text"
                placeholder="Search for an event, a topic..."
                className="hero__search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="hero__search-btn">
                Search
              </button>
            </div>
          </form>

          <div className="hero__actions">
            <Link to="/events" className="hero__btn hero__btn--primary">
              Explore Events
              <ArrowRight size={16} />
            </Link>
            <Link to="/register" className="hero__btn hero__btn--ghost">
              Create a free account
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
              <p className="section__eyebrow">Browse by topic</p>
              <h2 className="section__title">All categories</h2>
            </div>
            <Link to="/events" className="section__link">
              View all <ArrowRight size={15} />
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
                <Zap size={13} /> Featured
              </p>
              <h2 className="section__title">Featured Events</h2>
            </div>
            <Link to="/events" className="section__link">
              View all <ArrowRight size={15} />
            </Link>
          </div>
          {loading ? (
            <div className="section__loading">
              <LoadingSpinner size="md" text="Loading events…" />
            </div>
          ) : featured.length === 0 ? (
            <div className="section__empty">
              <Calendar size={40} strokeWidth={1.5} />
              <p>No published events yet.</p>
              <Link to="/events" className="btn-primary-sm">Browse anyway</Link>
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
                  <TrendingUp size={13} /> Trending
                </p>
                <h2 className="section__title">Most Popular</h2>
              </div>
              <Link to="/events" className="section__link">
                View all <ArrowRight size={15} />
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
            <h2 className="cta-banner__title">Ready for your next experience?</h2>
            <p className="cta-banner__subtitle">
              {isAuthenticated
                ? 'Welcome back! Discover and register for upcoming LinSoft events.'
                : 'Join our community and never miss an important LinSoft event.'}
            </p>
          </div>
          <div className="cta-banner__actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="cta-banner__btn cta-banner__btn--white">
                My Dashboard
              </Link>
            ) : (
              <Link to="/register" className="cta-banner__btn cta-banner__btn--white">
                Sign up for free
              </Link>
            )}
            <Link to="/events" className="cta-banner__btn cta-banner__btn--outline">
              Browse events
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
