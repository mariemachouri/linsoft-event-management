import api from './api';
import type { Event } from '../types';

export const eventsService = {
  async getAll(): Promise<Event[]> {
    const response = await api.get<Event[]>('/events');
    return response.data;
  },

  async getById(id: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  async create(event: Partial<Event>): Promise<Event> {
    const response = await api.post<Event>('/events', event);
    return response.data;
  },

  async update(id: string, event: Partial<Event>): Promise<Event> {
    const response = await api.put<Event>(`/events/${id}`, event);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  },

  getImageUrl(event: Event): string {
    if (event.imageUrl) return event.imageUrl;
    const categoryImages: Record<string, string> = {
      CONFERENCE: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
      WORKSHOP: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80',
      CONCERT: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80',
      SPORT: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80',
      NETWORKING: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80',
      FESTIVAL: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80',
      SEMINAR: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80',
      OTHER: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&q=80',
    };
    return categoryImages[event.category] || categoryImages.OTHER;
  },

  getEventTitle(event: Event): string {
    return event.title || event.name || 'Événement sans titre';
  },

  getEventStartDate(event: Event): string {
    return event.startAt || event.startDate || '';
  },

  getEventEndDate(event: Event): string {
    return event.endAt || event.endDate || '';
  },

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  },

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  },

  getAvailabilityPercent(event: Event): number {
    if (!event.maxParticipants) return 0;
    return Math.min(100, Math.round(((event.currentParticipants || 0) / event.maxParticipants) * 100));
  },

  getRemainingSpots(event: Event): number {
    return Math.max(0, (event.maxParticipants || 0) - (event.currentParticipants || 0));
  },
};
