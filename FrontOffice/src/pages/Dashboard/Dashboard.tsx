import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Layout,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { eventsService } from '../../services/events.service';
import { registrationsService } from '../../services/registrations.service';
import type { Event, Registration } from '../../types';
import './Dashboard.css';

type TabKey = 'all' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';

interface RegistrationWithEvent extends Registration {
  event?: Event;
}

export default function Dashboard() {
  const auth = useAuth();
  const { showToast } = useToast();

  const [items, setItems]     = useState<RegistrationWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<TabKey>('all');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const regs  = await registrationsService.getAll();
      const mine  = auth.user
        ? regs.filter((r) => r.participantId === auth.user!.id)
        : regs;

      // Enrich with event data
      const enriched = await Promise.all(
        mine.map(async (reg) => {
          try {
            const event = await eventsService.getById(reg.eventId);
            return { ...reg, event };
          } catch {
            return { ...reg };
          }
        })
      );

      // Sort by most recent first
      enriched.sort((a, b) => {
        const da = new Date(a.createdAt ?? 0).getTime();
        const db = new Date(b.createdAt ?? 0).getTime();
        return db - da;
      });

      setItems(enriched);
    } catch {
      showToast('error', 'Error loading your registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [auth.user]);

  const handleCancel = async (regId: string) => {
    setCancelling(regId);
    try {
      await registrationsService.cancel(regId);
      setItems((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status: 'CANCELLED' as const } : r))
      );
      showToast('success', 'Registration cancelled.');
    } catch {
      showToast('error', 'Unable to cancel this registration.');
    } finally {
      setCancelling(null);
    }
  };

  const displayed =
    tab === 'all' ? items : items.filter((r) => r.status === tab);

  const counts = {
    all:       items.length,
    PENDING:   items.filter((r) => r.status === 'PENDING').length,
    CONFIRMED: items.filter((r) => r.status === 'CONFIRMED').length,
    CANCELLED: items.filter((r) => r.status === 'CANCELLED').length,
  };

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'all',       label: 'All',        icon: <Layout size={14} /> },
    { key: 'PENDING',   label: 'Pending',    icon: <Clock size={14} /> },
    { key: 'CONFIRMED', label: 'Confirmed',  icon: <CheckCircle size={14} /> },
    { key: 'CANCELLED', label: 'Cancelled',  icon: <XCircle size={14} /> },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:   { label: 'Pending',   color: '#e67e22', bg: 'rgba(230,126,34,0.1)' },
    CONFIRMED: { label: 'Confirmed',  color: '#27ae60', bg: 'rgba(39,174,96,0.1)' },
    CANCELLED: { label: 'Cancelled',  color: '#e74c3c', bg: 'rgba(231,76,60,0.1)' },
  };

  return (
    <main className="dashboard">
      {/* Header */}
      <section className="dashboard-hero">
        <div className="dashboard-hero__inner">
          <div className="dashboard-hero__left">
            <h1 className="dashboard-hero__title">
              Hello, {auth.user?.firstName ?? auth.user?.username ?? 'participant'} 👋
            </h1>
            <p className="dashboard-hero__subtitle">
              Manage your event registrations
            </p>
          </div>
          <div className="dashboard-hero__actions">
            <button className="dashboard-hero__refresh" onClick={fetchData} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              Refresh
            </button>
            <Link to="/events" className="dashboard-hero__cta">
              <Calendar size={15} />
              Browse Events
            </Link>
          </div>
        </div>
      </section>

      <div className="dashboard-body">
        {/* Stats */}
        <div className="dashboard-stats">
          {[
            { label: 'Total Registrations', value: counts.all,       color: '#2A3652' },
            { label: 'Pending',              value: counts.PENDING,   color: '#e67e22' },
            { label: 'Confirmed',            value: counts.CONFIRMED, color: '#27ae60' },
            { label: 'Cancelled',            value: counts.CANCELLED, color: '#e74c3c' },
          ].map((s) => (
            <div key={s.label} className="dashboard-stat">
              <div className="dashboard-stat__value" style={{ color: s.color }}>{s.value}</div>
              <div className="dashboard-stat__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`dashboard-tab${tab === t.key ? ' dashboard-tab--active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.icon}
              {t.label}
              <span className="dashboard-tab__count">{counts[t.key]}</span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="dashboard-loading">
            <LoadingSpinner size="lg" text="Loading your registrations…" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="dashboard-empty">
            <div className="dashboard-empty__icon">📋</div>
            <h3>No {tab !== 'all' ? `"${TABS.find((t) => t.key === tab)?.label?.toLowerCase()}"` : ''} registrations</h3>
            <p>Browse available events and register!</p>
            <Link to="/events" className="dashboard-empty__btn">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="dashboard-list">
            {displayed.map((reg) => {
              const sc     = statusConfig[reg.status ?? 'PENDING'];
              const title  = reg.event ? eventsService.getEventTitle(reg.event) : `Event #${reg.eventId}`;
              const date   = reg.event ? eventsService.formatDate(eventsService.getEventStartDate(reg.event)) : '—';
              const imgUrl = reg.event ? eventsService.getImageUrl(reg.event) : null;
              const canCancel = reg.status === 'PENDING' || reg.status === 'CONFIRMED';

              return (
                <div key={reg.id} className="dashboard-item">
                  {imgUrl && (
                    <div className="dashboard-item__img">
                      <img src={imgUrl} alt={title} />
                    </div>
                  )}
                  <div className="dashboard-item__content">
                    <div className="dashboard-item__header">
                      <h3 className="dashboard-item__title">{title}</h3>
                      <span
                        className="dashboard-item__status"
                        style={{ color: sc.color, background: sc.bg }}
                      >
                        {sc.label}
                      </span>
                    </div>
                    <div className="dashboard-item__meta">
                      <span><Calendar size={13} /> {date}</span>
                      {reg.event?.location && <span>📍 {reg.event.location}</span>}
                      <span>🎫 Registered on {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString('en-US') : '—'}</span>
                    </div>
                  </div>
                  <div className="dashboard-item__actions">
                    {reg.event && (
                      <Link to={`/events/${reg.eventId}`} className="dashboard-item__view">
                        <ExternalLink size={14} />
                        View
                      </Link>
                    )}
                    {canCancel && (
                      <button
                        className="dashboard-item__cancel"
                        onClick={() => handleCancel(reg.id)}
                        disabled={cancelling === reg.id}
                      >
                        {cancelling === reg.id ? <LoadingSpinner size="sm" /> : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
