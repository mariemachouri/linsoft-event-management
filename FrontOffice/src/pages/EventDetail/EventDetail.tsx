import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Share2,
  Tag,
  Users,
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import GuestRegistrationModal from '../../components/GuestRegistrationModal/GuestRegistrationModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { eventsService } from '../../services/events.service';
import { registrationsService } from '../../services/registrations.service';
import type { Event, GuestRegistrationForm, Registration } from '../../types';
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
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestRegistered, setGuestRegistered] = useState(false);

  // Fetch event
  useEffect(() => {
    if (!id) return;
    eventsService
      .getById(id)
      .then(setEvent)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // guestRegistered est en state React uniquement (pas de localStorage)
  // → se remet à zéro à chaque visite/rechargement de page

  // Check if user already registered
  useEffect(() => {
    if (!auth.isAuthenticated || !id || !auth.user) return;
    registrationsService
      .getAll()
      .then((regs) => {
        const mine = regs.find(
          (r) => r.eventId === id && r.participantId === auth.user?.id
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
        participantEmail: auth.user.email,
        participantPhone: auth.user.phoneNumber,
        participantName: `${auth.user.firstName ?? ''} ${auth.user.lastName ?? ''}`.trim() || auth.user.username,
      });
      setMyRegistration(reg);
      // Optimistic update: increment participant count immediately
      setEvent(prev => prev ? {
        ...prev,
        currentParticipants: (prev.currentParticipants ?? 0) + 1
      } : prev);
      showToast('success', 'Inscription réussie ! Consultez votre tableau de bord.');
      // Re-fetch after short delay to get accurate server count
      setTimeout(() => {
        if (id) eventsService.getById(id).then(setEvent).catch(() => {});
      }, 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'An error occurred during registration.';
      showToast('error', msg);
    } finally {
      setRegistering(false);
    }
  };

  const handleGuestRegister = async (form: GuestRegistrationForm) => {
    if (!event) return;
    const reg = await registrationsService.create({
      eventId: event.id,
      participantId: 'GUEST',
      isGuest: true,
      guestFirstName: form.firstName,
      guestLastName: form.lastName,
      guestEmail: form.email,
      guestPhone: form.phone,
    });
    setGuestRegistered(true);
    // Optimistic update
    setEvent(prev => prev ? {
      ...prev,
      currentParticipants: (prev.currentParticipants ?? 0) + 1
    } : prev);
    showToast('success', `Registration confirmed! Check ${form.email} for details.`);
    setTimeout(() => {
      if (id) eventsService.getById(id).then(setEvent).catch(() => {});
    }, 2000);
  };

  const handleCancelRegistration = async () => {
    if (!myRegistration) return;
    setRegistering(true);
    try {
      await registrationsService.cancel(myRegistration.id);
      setMyRegistration(null);
      // Optimistic update: decrement participant count immediately
      setEvent(prev => prev ? {
        ...prev,
        currentParticipants: Math.max(0, (prev.currentParticipants ?? 1) - 1)
      } : prev);
      showToast('info', 'Inscription annulée.');
      // Re-fetch after short delay to get accurate server count
      setTimeout(() => {
        if (id) eventsService.getById(id).then(setEvent).catch(() => {});
      }, 2000);
    } catch {
      showToast('error', 'Impossible d\'annuler l\'inscription.');
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      showToast('success', 'Lien copié dans le presse-papiers !');
    });
  };

  if (loading) return (
    <div className="event-detail-loading">
      <LoadingSpinner size="lg" text="Chargement de l'événement…" />
    </div>
  );

  if (notFound || !event) return (
    <div className="event-detail-notfound">
      <div className="event-detail-notfound__icon">🔍</div>
      <h2>Événement introuvable</h2>
      <p>Cet événement n'existe pas ou a été supprimé.</p>
      <Link to="/events" className="event-detail-notfound__btn">
        <ArrowLeft size={16} /> Retour aux événements
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
    PUBLISHED:  'Ouvert aux inscriptions',
    DRAFT:      'Bientôt disponible',
    COMPLETED:  'Événement terminé',
    CANCELLED:  'Événement annulé',
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
            <ArrowLeft size={16} /> Retour
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
                <span className="event-detail__meta-label">Date de début</span>
                <span className="event-detail__meta-value">{eventsService.formatDateTime(startDate)}</span>
              </div>
            </div>
            {endDate && (
              <div className="event-detail__meta-item">
                <Clock size={16} className="event-detail__meta-icon" />
                <div>
                  <span className="event-detail__meta-label">Date de fin</span>
                  <span className="event-detail__meta-value">{eventsService.formatDateTime(endDate)}</span>
                </div>
              </div>
            )}
            {event.location && (
              <div className="event-detail__meta-item">
                <MapPin size={16} className="event-detail__meta-icon" />
                <div>
                  <span className="event-detail__meta-label">Lieu</span>
                  <span className="event-detail__meta-value">{event.location}</span>
                </div>
              </div>
            )}
            <div className="event-detail__meta-item">
              <Users size={16} className="event-detail__meta-icon" />
              <div>
                <span className="event-detail__meta-label">Participants</span>
                <span className="event-detail__meta-value">
                  {event.currentParticipants ?? 0} / {event.maxParticipants ?? '∞'}
                </span>
              </div>
            </div>
            {event.isOnline && (
              <div className="event-detail__meta-item">
                <Tag size={16} className="event-detail__meta-icon" />
                <div>
                  <span className="event-detail__meta-label">Format</span>
                  <span className="event-detail__meta-value">
                    🌐 En ligne — le lien de connexion vous sera envoyé par email
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Capacity Bar */}
          {event.maxParticipants && (
            <div className="event-detail__capacity">
              <div className="event-detail__capacity-header">
                <span>Capacity</span>
                <span className={isFull ? 'capacity-full' : ''}>
                  {isFull ? 'Complet' : `${remaining} place${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`}
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
              <h2>À propos de cet événement</h2>
              <p>{event.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar / CTA */}
        <aside className="event-detail__sidebar">
          <div className="event-detail__card">
            {/* Registration Status */}
            {(isRegistered || guestRegistered) ? (
              <div className="event-detail__registered-badge">
                ✅ Vous êtes inscrit(e)
              </div>
            ) : isFull ? (
              <div className="event-detail__full-badge">
                Événement complet
              </div>
            ) : null}

            {/* CTA Button */}
            {isRegistered ? (
              <button
                className="event-detail__cta event-detail__cta--cancel"
                onClick={handleCancelRegistration}
                disabled={registering}
              >
                {registering ? <LoadingSpinner size="sm" /> : 'Annuler l\'inscription'}
              </button>
            ) : guestRegistered ? (
              <div className="event-detail__registered-info">
                Votre inscription est confirmée. Consultez votre e-mail pour les détails.
              </div>
            ) : !auth.isAuthenticated ? (
              <button
                className="event-detail__cta event-detail__cta--register"
                onClick={() => setGuestModalOpen(true)}
                disabled={!isPublished || isFull}
              >
                {!isPublished
                  ? 'Inscriptions non ouvertes'
                  : isFull
                  ? 'Complet'
                  : 'S\'inscrire à cet événement'}
              </button>
            ) : (
              <button
                className="event-detail__cta event-detail__cta--register"
                onClick={handleRegister}
                disabled={registering || !canRegister}
              >
                {registering
                  ? <LoadingSpinner size="sm" />
                  : !isPublished
                  ? 'Inscriptions non ouvertes'
                  : isFull
                  ? 'Complet'
                  : 'S\'inscrire à cet événement'}
              </button>
            )}

            <button className="event-detail__share" onClick={handleShare}>
              <Share2 size={15} />
              Partager l'événement
            </button>

            {/* Quick Info */}
            <div className="event-detail__quick-info">
              <div className="event-detail__qi-row">
                <span>Statut</span>
                <span style={{ color: statusColors[event.status ?? 'DRAFT'], fontWeight: 600 }}>
                  {statusLabels[event.status ?? 'DRAFT']}
                </span>
              </div>
              {event.category && (
                <div className="event-detail__qi-row">
                  <span>Catégorie</span>
                  <span>{event.category}</span>
                </div>
              )}
              <div className="event-detail__qi-row">
                <span>Places max</span>
                <span>{event.maxParticipants ?? 'Illimité'}</span>
              </div>
            </div>
          </div>

          {/* Guest: offer to sign in */}
          {!auth.isAuthenticated && !guestRegistered && isPublished && !isFull && (
            <p className="event-detail__guest-hint">
              Déjà un compte ?{' '}
              <Link to="/login" state={{ from: `/events/${id}` }}>Se connecter</Link>
            </p>
          )}

          {/* Go to Dashboard */}
          {auth.isAuthenticated && (
            <Link to="/dashboard" className="event-detail__dashboard-link">
              Voir mes inscriptions →
            </Link>
          )}
        </aside>
      </div>

      {/* Guest Registration Modal */}
      {guestModalOpen && event && (
        <GuestRegistrationModal
          eventTitle={title}
          onSubmit={handleGuestRegister}
          onClose={() => setGuestModalOpen(false)}
        />
      )}
    </main>
  );
}
