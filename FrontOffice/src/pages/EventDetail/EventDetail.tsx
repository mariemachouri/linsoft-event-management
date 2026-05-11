import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Lock,
  MapPin,
  Share2,
  Tag,
  Users,
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { eventsService } from '../../services/events.service';
import { registrationsService } from '../../services/registrations.service';
import type { Event, Registration } from '../../types';
import './EventDetail.css';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const { showToast } = useToast();

  const [event,    setEvent]    = useState<Event | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [registering,  setRegistering]  = useState(false);
  const [myRegistration, setMyRegistration] = useState<Registration | null>(null);
  const [imgError, setImgError] = useState(false);

  // Fetch event
  useEffect(() => {
    if (!id) return;
    eventsService
      .getById(id)
      .then(setEvent)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Check if user already registered
  useEffect(() => {
    if (!auth.isAuthenticated || !id || !auth.user) return;
    registrationsService
      .getAll()
      .then((regs) => {
        const mine = regs.find(
          (r) => r.eventId === id && r.userId === auth.user?.id
        );
        setMyRegistration(mine ?? null);
      })
      .catch(() => {});
  }, [auth.isAuthenticated, id, auth.user]);

  const handleRegister = async () => {
    if (!auth.isAuthenticated) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    if (!event || !auth.user) return;

    setRegistering(true);
    try {
      const reg = await registrationsService.create({
        eventId: event.id,
        participantId: auth.user.id,
      });
      setMyRegistration(reg);
      showToast('success', 'Registration successful! Check your dashboard.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'An error occurred during registration.';
      showToast('error', msg);
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!myRegistration) return;
    setRegistering(true);
    try {
      await registrationsService.cancel(myRegistration.id);
      setMyRegistration(null);
      showToast('info', 'Registration cancelled.');
    } catch {
      showToast('error', 'Unable to cancel registration.');
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      showToast('success', 'Link copied to clipboard!');
    });
  };

  if (loading) return (
    <div className="event-detail-loading">
      <LoadingSpinner size="lg" text="Loading event…" />
    </div>
  );

  if (notFound || !event) return (
    <div className="event-detail-notfound">
      <div className="event-detail-notfound__icon">🔍</div>
      <h2>Event Not Found</h2>
      <p>This event does not exist or has been removed.</p>
      <Link to="/events" className="event-detail-notfound__btn">
        <ArrowLeft size={16} /> Back to Events
      </Link>
    </div>
  );

  const title       = eventsService.getEventTitle(event);
  const startDate   = eventsService.getEventStartDate(event);
  const endDate     = eventsService.getEventEndDate(event);
  const imageUrl    = imgError ? eventsService.getImageUrl(event) : eventsService.getImageUrl(event);
  const remaining   = eventsService.getRemainingSpots(event);
  const availPct    = eventsService.getAvailabilityPercent(event);
  const isFull      = remaining <= 0;
  const isPublished = event.status === 'PUBLISHED';
  const isRegistered = !!myRegistration;

  const canRegister  = isPublished && !isFull && !isRegistered;
  const statusLabels: Record<string, string> = {
    PUBLISHED:  'Open for registration',
    DRAFT:      'Coming soon',
    COMPLETED:  'Event ended',
    CANCELLED:  'Event cancelled',
  };
  const statusColors: Record<string, string> = {
    PUBLISHED: '#27ae60',
    DRAFT:     '#e67e22',
    COMPLETED: '#7f8c8d',
    CANCELLED: '#e74c3c',
  };

  return (
    <main className="event-detail">
      {/* Hero Image */}
      <div className="event-detail__hero">
        <img
          src={imageUrl}
          alt={title}
          className="event-detail__hero-img"
          onError={() => setImgError(true)}
        />
        <div className="event-detail__hero-overlay" />
        <div className="event-detail__hero-content">
          <Link to="/events" className="event-detail__back">
            <ArrowLeft size={16} /> Back
          </Link>
          <span
            className="event-detail__status-badge"
            style={{ '--status-color': statusColors[event.status ?? 'DRAFT'] } as React.CSSProperties}
          >
            {statusLabels[event.status ?? 'DRAFT']}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="event-detail__body">
        {/* Main */}
        <div className="event-detail__main">
          {event.category && (
            <div className="event-detail__category">
              <Tag size={13} />
              {event.category}
            </div>
          )}

          <h1 className="event-detail__title">{title}</h1>

          <div className="event-detail__meta">
            <div className="event-detail__meta-item">
              <Calendar size={16} className="event-detail__meta-icon" />
              <div>
                <span className="event-detail__meta-label">Start Date</span>
                <span className="event-detail__meta-value">{eventsService.formatDateTime(startDate)}</span>
              </div>
            </div>
            {endDate && (
              <div className="event-detail__meta-item">
                <Clock size={16} className="event-detail__meta-icon" />
                <div>
                  <span className="event-detail__meta-label">End Date</span>
                  <span className="event-detail__meta-value">{eventsService.formatDateTime(endDate)}</span>
                </div>
              </div>
            )}
            {event.location && (
              <div className="event-detail__meta-item">
                <MapPin size={16} className="event-detail__meta-icon" />
                <div>
                  <span className="event-detail__meta-label">Location</span>
                  <span className="event-detail__meta-value">{event.location}</span>
                </div>
              </div>
            )}
            <div className="event-detail__meta-item">
              <Users size={16} className="event-detail__meta-icon" />
              <div>
                <span className="event-detail__meta-label">Attendees</span>
                <span className="event-detail__meta-value">
                  {event.currentParticipants ?? 0} / {event.maxParticipants ?? '∞'}
                </span>
              </div>
            </div>
          </div>

          {/* Capacity Bar */}
          {event.maxParticipants && (
            <div className="event-detail__capacity">
              <div className="event-detail__capacity-header">
                <span>Capacity</span>
                <span className={isFull ? 'capacity-full' : ''}>
                  {isFull ? 'Full' : `${remaining} spot${remaining !== 1 ? 's' : ''} left`}
                </span>
              </div>
              <div className="event-detail__capacity-bar">
                <div
                  className="event-detail__capacity-fill"
                  style={{ width: `${availPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="event-detail__description">
              <h2>About This Event</h2>
              <p>{event.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar / CTA */}
        <aside className="event-detail__sidebar">
          <div className="event-detail__card">
            {/* Registration Status */}
            {isRegistered ? (
              <div className="event-detail__registered-badge">
                ✅ You are registered
              </div>
            ) : isFull ? (
              <div className="event-detail__full-badge">
                Event is full
              </div>
            ) : null}

            {/* CTA Button */}
            {isRegistered ? (
              <button
                className="event-detail__cta event-detail__cta--cancel"
                onClick={handleCancelRegistration}
                disabled={registering}
              >
                {registering ? <LoadingSpinner size="sm" /> : 'Cancel Registration'}
              </button>
            ) : !auth.isAuthenticated ? (
              <Link
                to="/login"
                state={{ from: `/events/${id}` }}
                className="event-detail__cta event-detail__cta--login"
              >
                <Lock size={15} />
                Sign in to Register
              </Link>
            ) : (
              <button
                className="event-detail__cta event-detail__cta--register"
                onClick={handleRegister}
                disabled={registering || !canRegister}
              >
                {registering
                  ? <LoadingSpinner size="sm" />
                  : !isPublished
                  ? 'Registration not open'
                  : isFull
                  ? 'Full'
                  : 'Register for this Event'}
              </button>
            )}

            <button className="event-detail__share" onClick={handleShare}>
              <Share2 size={15} />
              Share Event
            </button>

            {/* Quick Info */}
            <div className="event-detail__quick-info">
              <div className="event-detail__qi-row">
                <span>Status</span>
                <span style={{ color: statusColors[event.status ?? 'DRAFT'], fontWeight: 600 }}>
                  {statusLabels[event.status ?? 'DRAFT']}
                </span>
              </div>
              {event.category && (
                <div className="event-detail__qi-row">
                  <span>Category</span>
                  <span>{event.category}</span>
                </div>
              )}
              <div className="event-detail__qi-row">
                <span>Max spots</span>
                <span>{event.maxParticipants ?? 'Unlimited'}</span>
              </div>
            </div>
          </div>

          {/* Go to Dashboard */}
          {auth.isAuthenticated && (
            <Link to="/dashboard" className="event-detail__dashboard-link">
              View my registrations →
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}
