import React, { useEffect, useRef, useState } from 'react';
import { User, Mail, Phone, X, Loader2, CheckCircle2 } from 'lucide-react';
import type { GuestRegistrationForm } from '../../types';
import './GuestRegistrationModal.css';

interface Props {
  eventTitle: string;
  onSubmit: (form: GuestRegistrationForm) => Promise<void>;
  onClose: () => void;
}

const EMPTY: GuestRegistrationForm = { firstName: '', lastName: '', email: '', phone: '' };

export default function GuestRegistrationModal({ eventTitle, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<GuestRegistrationForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<GuestRegistrationForm>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus first field on open
  useEffect(() => { firstInputRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const validate = (): boolean => {
    const e: Partial<GuestRegistrationForm> = {};
    if (!form.firstName.trim()) e.firstName = 'Requis';
    if (!form.lastName.trim())  e.lastName  = 'Requis';
    if (!form.email.trim())     e.email     = 'Requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Adresse e-mail invalide';
    if (!form.phone.trim())     e.phone     = 'Requis';
    else if (!/^[+\d\s\-()]{7,20}$/.test(form.phone)) e.phone = 'Numéro de téléphone invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const change = (field: keyof GuestRegistrationForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(form);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="grm-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="grm-modal" role="dialog" aria-modal="true" aria-labelledby="grm-title">

        {/* Header */}
        <div className="grm-header">
          <div className="grm-header-text">
            <h2 id="grm-title" className="grm-title">S'inscrire à cet événement</h2>
            <p className="grm-subtitle">{eventTitle}</p>
          </div>
          <button className="grm-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Success state */}
        {done ? (
          <div className="grm-success">
            <div className="grm-success-icon"><CheckCircle2 size={48} /></div>
            <h3>Vous êtes inscrit(e) !</h3>
            <p>
              Une confirmation a été envoyée à <strong>{form.email}</strong>.<br />
              Vous recevrez les notifications de l'événement sur cet e-mail et ce numéro de téléphone.
            </p>
            <button className="grm-btn grm-btn--primary" onClick={onClose}>
              Fermer
            </button>
          </div>
        ) : (
          <form className="grm-form" onSubmit={handleSubmit} noValidate>
            <p className="grm-info">
              Aucun compte nécessaire — remplissez vos coordonnées pour recevoir votre confirmation et les notifications de l'événement.
            </p>

            {/* Row: First + Last name */}
            <div className="grm-row">
              <div className={`grm-field${errors.firstName ? ' grm-field--error' : ''}`}>
                <label className="grm-label">Prénom *</label>
                <div className="grm-input-wrap">
                  <User size={15} className="grm-input-icon" />
                  <input
                    ref={firstInputRef}
                    type="text"
                    className="grm-input"
                    placeholder="Pierre"
                    value={form.firstName}
                    onChange={change('firstName')}
                    autoComplete="given-name"
                  />
                </div>
                {errors.firstName && <span className="grm-error">{errors.firstName}</span>}
              </div>

              <div className={`grm-field${errors.lastName ? ' grm-field--error' : ''}`}>
                <label className="grm-label">Nom *</label>
                <div className="grm-input-wrap">
                  <User size={15} className="grm-input-icon" />
                  <input
                    type="text"
                    className="grm-input"
                    placeholder="Dupont"
                    value={form.lastName}
                    onChange={change('lastName')}
                    autoComplete="family-name"
                  />
                </div>
                {errors.lastName && <span className="grm-error">{errors.lastName}</span>}
              </div>
            </div>

            {/* Email */}
            <div className={`grm-field${errors.email ? ' grm-field--error' : ''}`}>
              <label className="grm-label">Adresse e-mail *</label>
              <div className="grm-input-wrap">
                <Mail size={15} className="grm-input-icon" />
                <input
                  type="email"
                  className="grm-input"
                  placeholder="john.doe@example.com"
                  value={form.email}
                  onChange={change('email')}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="grm-error">{errors.email}</span>}
            </div>

            {/* Phone */}
            <div className={`grm-field${errors.phone ? ' grm-field--error' : ''}`}>
              <label className="grm-label">Numéro de téléphone *</label>
              <div className="grm-input-wrap">
                <Phone size={15} className="grm-input-icon" />
                <input
                  type="tel"
                  className="grm-input"
                  placeholder="+213 555 123 456"
                  value={form.phone}
                  onChange={change('phone')}
                  autoComplete="tel"
                />
              </div>
              {errors.phone && <span className="grm-error">{errors.phone}</span>}
            </div>

            {/* Actions */}
            <div className="grm-actions">
              <button type="button" className="grm-btn grm-btn--ghost" onClick={onClose} disabled={loading}>
                Annuler
              </button>
              <button type="submit" className="grm-btn grm-btn--primary" disabled={loading}>
                {loading
                  ? <><Loader2 size={16} className="grm-spin" /> Inscription en cours…</>
                  : 'Confirmer l\'inscription'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
