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
      showToast('error', 'Erreur lors du chargement de vos inscriptions.');
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
      showToast('success', 'Inscription annulée.');
    } catch {
      showToast('error', 'Impossible d\'annuler cette inscription.');
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
    { key: 'all',       label: 'Toutes',      icon: <Layout size={14} /> },
    { key: 'PENDING',   label: 'En attente',  icon: <Clock size={14} /> },
    { key: 'CONFIRMED', label: 'Confirmées',  icon: <CheckCircle size={14} /> },
    { key: 'CANCELLED', label: 'Annulées',    icon: <XCircle size={14} /> },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:   { label: 'En attente',  color: '#e67e22', bg: 'rgba(230,126,34,0.1)' },
    CONFIRMED: { label: 'Confirmée',   color: '#27ae60', bg: 'rgba(39,174,96,0.1)' },
    CANCELLED: { label: 'Annulée',     color: '#e74c3c', bg: 'rgba(231,76,60,0.1)' },
  };

  return (
    <main className="dashboard">
      {/* Header */}
      <section className="dashboard-hero">
        <div className="dashboard-hero__inner">
          <div className="dashboard-hero__left">
            <h1 className="dashboard-hero__title">
              Bonjour, {auth.user?.firstName ?? auth.user?.username ?? 'participant'} 👋
            </h1>
          </div>
          <div className="dashboard-hero__actions">
            <button className="dashboard-hero__refresh" onClick={fetchData} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              Actualiser
            </button>
            <Link to="/events" className="dashboard-hero__cta">
              <Calendar size={15} />
              Parcourir les événements
            </Link>
          </div>
        </div>
      </section>

      <div className="dashboard-body">
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
            <LoadingSpinner size="lg" text="Chargement de vos inscriptions…" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="dashboard-empty">
            <div className="dashboard-empty__icon">📋</div>
            <h3>Aucune inscription{tab !== 'all' ? ` "${TABS.find((t) => t.key === tab)?.label?.toLowerCase()}"` : ''}</h3>
            <p>Parcourez les événements disponibles et inscrivez-vous !</p>
            <Link to="/events" className="dashboard-empty__btn">
              Parcourir les événements
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
                      <span>🎫 Inscrit le {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString('fr-FR') : '—'}</span>
                    </div>
                  </div>
                  <div className="dashboard-item__actions">
                    {reg.event && (
                      <Link to={`/events/${reg.eventId}`} className="dashboard-item__view">
                        <ExternalLink size={14} />
                        Voir
                      </Link>
                    )}
                    {canCancel && (
                      <button
                        className="dashboard-item__cancel"
                        onClick={() => handleCancel(reg.id)}
                        disabled={cancelling === reg.id}
                      >
                        {cancelling === reg.id ? <LoadingSpinner size="sm" /> : 'Annuler'}
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
