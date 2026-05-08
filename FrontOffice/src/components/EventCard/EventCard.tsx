import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Tag, Clock, ArrowRight } from 'lucide-react';
import type { Event } from '../../types';
import { eventsService } from '../../services/events.service';
import './EventCard.css';

const CATEGORY_LABELS: Record<string, string> = {
  CONFERENCE: 'Conférence',
  WORKSHOP: 'Atelier',
  CONCERT: 'Concert',
  SPORT: 'Sport',
  NETWORKING: 'Networking',
  FESTIVAL: 'Festival',
  SEMINAR: 'Séminaire',
  OTHER: 'Autre',
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PUBLISHED:  { label: 'Ouvert',    className: 'event-card__badge--success' },
  DRAFT:      { label: 'Bientôt',   className: 'event-card__badge--warning' },
  COMPLETED:  { label: 'Terminé',   className: 'event-card__badge--neutral' },
  CANCELLED:  { label: 'Annulé',    className: 'event-card__badge--danger'  },
};

interface EventCardProps {
  event: Event;
  className?: string;
  style?: CSSProperties;
}

export default function EventCard({ event, className = '', style }: EventCardProps) {
  const title = eventsService.getEventTitle(event);
  const startDate = eventsService.getEventStartDate(event);
  const imageUrl = eventsService.getImageUrl(event);
  const availabilityPct = eventsService.getAvailabilityPercent(event);
  const remaining = eventsService.getRemainingSpots(event);
  const statusCfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.DRAFT;
  const isFull = remaining <= 0;

  return (
    <article className={`event-card ${className}`} style={style}>
      {/* Image */}
      <div className="event-card__img-wrap">
        <img
          src={imageUrl}
          alt={title}
          className="event-card__img"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&q=80';
          }}
        />
        <div className="event-card__overlay" />
        {/* Category */}
        <span className="event-card__category">
          <Tag size={11} strokeWidth={2.5} />
          {CATEGORY_LABELS[event.category] ?? event.category}
        </span>
        {/* Status */}
        <span className={`event-card__badge ${statusCfg.className}`}>{statusCfg.label}</span>
      </div>

      {/* Body */}
      <div className="event-card__body">
        <h3 className="event-card__title">{title}</h3>

        <p className="event-card__desc">
          {event.description?.slice(0, 100) ?? 'Aucune description disponible.'}
          {(event.description?.length ?? 0) > 100 ? '…' : ''}
        </p>

        <div className="event-card__meta">
          {startDate && (
            <span className="event-card__meta-item">
              <Calendar size={13} strokeWidth={2.5} />
              {eventsService.formatDate(startDate)}
            </span>
          )}
          {event.location && (
            <span className="event-card__meta-item">
              <MapPin size={13} strokeWidth={2.5} />
              {event.location}
            </span>
          )}
        </div>

        {/* Capacity */}
        <div className="event-card__capacity">
          <div className="event-card__capacity-header">
            <span className="event-card__capacity-label">
              <Users size={12} strokeWidth={2.5} />
              {isFull ? 'Complet' : `${remaining} place${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`}
            </span>
            <span className="event-card__capacity-value">{availabilityPct}%</span>
          </div>
          <div className="event-card__progress">
            <div
              className={`event-card__progress-bar${availabilityPct >= 90 ? ' event-card__progress-bar--full' : ''}`}
              style={{ width: `${availabilityPct}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="event-card__footer">
          <div className="event-card__duration">
            <Clock size={12} strokeWidth={2.5} />
            <span>{eventsService.formatDate(startDate)}</span>
          </div>
          <Link
            to={`/events/${event.id}`}
            className={`event-card__cta${isFull || event.status !== 'PUBLISHED' ? ' event-card__cta--disabled' : ''}`}
          >
            {isFull ? 'Complet' : 'Voir'}
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </article>
  );
}
