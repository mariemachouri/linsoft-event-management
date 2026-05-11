import api from './api';
import type { Registration } from '../types';

export const registrationsService = {
  async getAll(): Promise<Registration[]> {
    const response = await api.get<Registration[]>('/registrations');
    return response.data;
  },

  async getById(id: string): Promise<Registration> {
    const response = await api.get<Registration>(`/registrations/${id}`);
    return response.data;
  },

  async create(registration: { eventId: string; participantId: string; notes?: string }): Promise<Registration> {
    const response = await api.post<Registration>('/registrations', registration);
    return response.data;
  },

  async confirm(id: string): Promise<Registration> {
    const response = await api.post<Registration>(`/registrations/${id}/confirm`);
    return response.data;
  },

  async cancel(id: string): Promise<Registration> {
    const response = await api.post<Registration>(`/registrations/${id}/cancel`);
    return response.data;
  },

  async updateStatus(id: string, status: string): Promise<Registration> {
    const response = await api.put<Registration>(`/registrations/${id}/status`, { status });
    return response.data;
  },

  getUserRegistrations(registrations: Registration[], userId: string): Registration[] {
    return registrations.filter((r) => r.participantId === userId);
  },

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      CANCELLED: 'Annulée',
      WAITLISTED: 'Liste d\'attente',
    };
    return labels[status] || status;
  },

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      PENDING: '#f39c12',
      CONFIRMED: '#27ae60',
      CANCELLED: '#e74c3c',
      WAITLISTED: '#3498db',
    };
    return colors[status] || '#7f8c8d';
  },
};
