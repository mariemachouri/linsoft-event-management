import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle, Eye, EyeOff, Lock, Mail, Phone, Save, Search, Shield, Trash2, User } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/auth.service';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName:   user?.firstName   ?? '',
    lastName:    user?.lastName    ?? '',
    phoneNumber: user?.phoneNumber ?? '',
  });
  const [avatarUrl, setAvatarUrl]   = useState<string>(user?.avatarUrl ?? '');
  const [loading, setLoading]       = useState(false);
  const [saved, setSaved]           = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [search, setSearch]           = useState('');

  useEffect(() => {
    if (!user?.email || !user?.firstName) {
      authService.getCurrentUser().then((fresh) => {
        if (fresh) updateUser({ ...fresh, avatarUrl: user?.avatarUrl });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setForm({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phoneNumber: user?.phoneNumber ?? '' });
    setAvatarUrl(user?.avatarUrl ?? '');
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('warning', "L'image doit faire moins de 2 Mo."); return; }
    const reader = new FileReader();
    reader.onload = () => { setAvatarUrl(reader.result as string); setSaved(false); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = () => { setAvatarUrl(''); setSaved(false); };

  const avatarKey = user?.id ? `user_avatar_${user.id}` : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) { showToast('warning', 'Le prénom et le nom sont requis.'); return; }
    if (avatarKey) { avatarUrl ? localStorage.setItem(avatarKey, avatarUrl) : localStorage.removeItem(avatarKey); }
    const localUpdate = { ...(user as NonNullable<typeof user>), ...form, avatarUrl: avatarUrl || undefined };
    updateUser(localUpdate);
    setSaved(true);
    if (user?.id) {
      setLoading(true);
      try {
        const updated = await authService.updateProfile(user.id, { firstName: form.firstName.trim(), lastName: form.lastName.trim(), phoneNumber: form.phoneNumber.trim() || undefined });
        updateUser({ ...updated, avatarUrl: avatarUrl || undefined });
        showToast('success', 'Profil mis à jour avec succès !');
      } catch { showToast('error', 'Synchronisation impossible, modifications enregistrées localement.'); }
      finally { setLoading(false); }
    } else { showToast('success', 'Profil mis à jour avec succès !'); }
  };

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';

  const roleLabel = (user?.roles ?? []).some(r => ['admin','organizer','organisateur'].includes(r.toLowerCase()))
    ? 'Administrateur / Organisateur'
    : 'Participant';

  return (
    <main className="settings-page">

      {/* Top search */}
      <div className="settings-search-bar">
        <Search size={15} className="settings-search-icon" />
        <input
          type="text"
          placeholder="Rechercher dans les paramètres..."
          className="settings-search-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="settings-body">

        {/* ── Section Account ── */}
        <section className="settings-section">
          <div className="settings-section__label">Account</div>
          <p className="settings-section__sub">Informations en temps réel de votre compte</p>

          {/* Profile picture */}
          <div className="settings-row settings-row--picture">
            <div className="settings-row__left">
              <div className="settings-avatar" onClick={handleAvatarClick}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="settings-avatar__img" />
                ) : (
                  <span>{initials}</span>
                )}
                <div className="settings-avatar__overlay"><Camera size={18} /></div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="settings-avatar__input" onChange={handleFileChange} />
              <div className="settings-avatar__info">
                <span className="settings-avatar__name">{form.firstName || user?.firstName} {form.lastName || user?.lastName}</span>
                <span className="settings-avatar__role">{roleLabel}</span>
                <span className="settings-avatar__hint">PNG, JPEG moins de 2 Mo</span>
              </div>
            </div>
            <div className="settings-row__actions">
              <button className="settings-btn settings-btn--ghost" onClick={handleAvatarClick} type="button">
                Changer la photo
              </button>
              {avatarUrl && (
                <button className="settings-btn settings-btn--danger-ghost" onClick={handleRemoveAvatar} type="button">
                  <Trash2 size={13} /> Supprimer
                </button>
              )}
            </div>
          </div>

          <div className="settings-divider" />

          {/* Full name */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="settings-field-group">
              <div className="settings-field-label">
                <User size={15} />
                Nom complet
              </div>
              <div className="settings-field-row">
                <div className="settings-field">
                  <label className="settings-label">Prénom</label>
                  <input name="firstName" type="text" className="settings-input" value={form.firstName} onChange={handleChange} disabled={loading} placeholder="Votre prénom" />
                </div>
                <div className="settings-field">
                  <label className="settings-label">Nom</label>
                  <input name="lastName" type="text" className="settings-input" value={form.lastName} onChange={handleChange} disabled={loading} placeholder="Votre nom" />
                </div>
              </div>
            </div>

            <div className="settings-divider" />

            {/* Contact email */}
            <div className="settings-field-group">
              <div className="settings-field-label">
                <Mail size={15} />
                Email de contact
              </div>
              <p className="settings-field-desc">Adresse email associée à votre compte.</p>
              <div className="settings-input-wrap">
                <input type="email" className="settings-input settings-input--readonly" value={user?.email ?? ''} readOnly />
                <span className="settings-readonly-badge">Lecture seule</span>
              </div>
            </div>

            <div className="settings-divider" />

            {/* Phone */}
            <div className="settings-field-group">
              <div className="settings-field-label">
                <Phone size={15} />
                Téléphone <span className="settings-optional">(optionnel)</span>
              </div>
              <input name="phoneNumber" type="tel" className="settings-input settings-input--half" value={form.phoneNumber} onChange={handleChange} disabled={loading} placeholder="+216 XX XXX XXX" />
            </div>

            <div className="settings-divider" />

            {/* Save */}
            <div className="settings-form-footer">
              <button type="submit" className="settings-btn settings-btn--primary" disabled={loading || saved}>
                {loading ? <LoadingSpinner size="sm" /> : saved ? <><CheckCircle size={14} /> Enregistré</> : <><Save size={14} /> Enregistrer les modifications</>}
              </button>
            </div>
          </form>
        </section>

        {/* ── Section Mot de passe ── */}
        <section className="settings-section">
          <div className="settings-section__label">
            <Lock size={15} />
            Mot de passe
          </div>
          <p className="settings-section__sub">Modifiez votre mot de passe actuel.</p>

          <div className="settings-field-row">
            <div className="settings-field">
              <label className="settings-label">Mot de passe actuel</label>
              <div className="settings-pwd-wrap">
                <input type={showCurrent ? 'text' : 'password'} className="settings-input settings-input--pwd" placeholder="••••••••••" />
                <button type="button" className="settings-pwd-toggle" onClick={() => setShowCurrent(v => !v)}>
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="settings-field">
              <label className="settings-label">Nouveau mot de passe</label>
              <div className="settings-pwd-wrap">
                <input type={showNew ? 'text' : 'password'} className="settings-input settings-input--pwd" placeholder="••••••••••" />
                <button type="button" className="settings-pwd-toggle" onClick={() => setShowNew(v => !v)}>
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div className="settings-form-footer">
            <button type="button" className="settings-btn settings-btn--primary" onClick={() => showToast('info', 'Changement de mot de passe via Keycloak — fonctionnalité à venir.')}>
              <Lock size={14} /> Changer le mot de passe
            </button>
          </div>
        </section>

        {/* ── Section Sécurité ── */}
        <section className="settings-section">
          <div className="settings-section__label">
            <Shield size={15} />
            Compte intégré
          </div>
          <p className="settings-section__sub">Gérez votre authentification et vos informations de compte.</p>

          <div className="settings-integration-row">
            <div className="settings-integration-icon settings-integration-icon--keycloak">K</div>
            <div className="settings-integration-info">
              <strong>Keycloak SSO</strong>
              <span>Authentification centralisée LinSoft</span>
            </div>
            <span className="settings-integration-badge settings-integration-badge--connected">Connecté</span>
          </div>

          <div className="settings-divider" />

          <div className="settings-integration-row">
            <div className="settings-integration-icon settings-integration-icon--user">
              <User size={18} />
            </div>
            <div className="settings-integration-info">
              <strong>@{user?.username}</strong>
              <span>Nom d'utilisateur — lecture seule</span>
            </div>
            <span className="settings-integration-badge">{roleLabel}</span>
          </div>
        </section>

      </div>
    </main>
  );
}
