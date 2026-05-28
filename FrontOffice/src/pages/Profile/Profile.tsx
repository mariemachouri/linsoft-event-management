import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle, Mail, Phone, Save, Trash2, User } from 'lucide-react';
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
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl ?? '');
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);

  // Refresh user profile from API if stored data is incomplete (e.g. fallback after login)
  useEffect(() => {
    if (!user?.email || !user?.firstName) {
      authService.getCurrentUser().then((fresh) => {
        if (fresh) {
          // Preserve locally-stored avatar
          updateUser({ ...fresh, avatarUrl: user?.avatarUrl });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setForm({
      firstName:   user?.firstName   ?? '',
      lastName:    user?.lastName    ?? '',
      phoneNumber: user?.phoneNumber ?? '',
    });
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
    if (file.size > 2 * 1024 * 1024) {
      showToast('warning', 'Image must be smaller than 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatarUrl(base64);
      setSaved(false);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    setSaved(false);
  };

  // Clé de stockage stable liée à l'utilisateur (survit aux déconnexions)
  const avatarKey = user?.id ? `user_avatar_${user.id}` : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      showToast('warning', 'First name and last name are required.');
      return;
    }

    // Persister la photo séparément (survit à la déconnexion)
    if (avatarKey) {
      if (avatarUrl) {
        localStorage.setItem(avatarKey, avatarUrl);
      } else {
        localStorage.removeItem(avatarKey);
      }
    }

    // Always persist avatar + form changes locally first
    const localUpdate: typeof user = {
      ...(user as NonNullable<typeof user>),
      firstName:   form.firstName.trim(),
      lastName:    form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim() || undefined,
      avatarUrl:   avatarUrl || undefined,
    };
    updateUser(localUpdate);
    setSaved(true);

    // If we have a valid id, also push changes to the API
    if (user?.id) {
      setLoading(true);
      try {
        const updated = await authService.updateProfile(user.id, {
          firstName:   form.firstName.trim(),
          lastName:    form.lastName.trim(),
          phoneNumber: form.phoneNumber.trim() || undefined,
        });
        // Merge API response with local avatar
        updateUser({ ...updated, avatarUrl: avatarUrl || undefined });
        showToast('success', 'Profile updated successfully!');
      } catch {
        showToast('error', 'Could not sync with server, changes saved locally.');
      } finally {
        setLoading(false);
      }
    } else {
      showToast('success', 'Profile updated successfully!');
    }
  };

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="profile-hero__inner">
          {/* Avatar with edit overlay */}
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar" onClick={handleAvatarClick} title="Change photo">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="profile-avatar__img" />
              ) : (
                <span>{initials}</span>
              )}
              <div className="profile-avatar__overlay">
                <Camera size={20} />
              </div>
            </div>
            {avatarUrl && (
              <button
                type="button"
                className="profile-avatar__remove"
                onClick={handleRemoveAvatar}
                title="Remove photo"
              >
                <Trash2 size={13} />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="profile-avatar__input"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <h1 className="profile-hero__name">
              {form.firstName || user?.firstName} {form.lastName || user?.lastName}
            </h1>
            <p className="profile-hero__username">@{user?.username}</p>
            <p className="profile-hero__photo-hint">Click the photo to change it</p>
          </div>
        </div>
      </section>

      <div className="profile-body">
        <div className="profile-card">
          <div className="profile-card__header">
            <h2>Personal Information</h2>
            <p>Update your profile information</p>
          </div>

          <form className="profile-form" onSubmit={handleSubmit} noValidate>
            {/* Read-only */}
            <div className="profile-field profile-field--readonly">
              <label className="profile-label">
                <Mail size={14} /> Email Address
              </label>
              <div className="profile-input-wrap">
                <input
                  type="email"
                  className="profile-input profile-input--disabled"
                  value={user?.email ?? ''}
                  readOnly
                />
                <span className="profile-input-badge">Read-only</span>
              </div>
            </div>

            <div className="profile-field profile-field--readonly">
              <label className="profile-label">
                <User size={14} /> Username
              </label>
              <div className="profile-input-wrap">
                <input
                  type="text"
                  className="profile-input profile-input--disabled"
                  value={user?.username ?? ''}
                  readOnly
                />
                <span className="profile-input-badge">Read-only</span>
              </div>
            </div>

            <div className="profile-divider" />

            {/* Editable */}
            <div className="profile-row">
              <div className="profile-field">
                <label className="profile-label">First Name *</label>
                <input
                  name="firstName"
                  type="text"
                  className="profile-input"
                  value={form.firstName}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Your first name"
                />
              </div>
              <div className="profile-field">
                <label className="profile-label">Last Name *</label>
                <input
                  name="lastName"
                  type="text"
                  className="profile-input"
                  value={form.lastName}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Your last name"
                />
              </div>
            </div>

            <div className="profile-field">
              <label className="profile-label">
                <Phone size={14} /> Phone{' '}
                <span className="profile-optional">(optional)</span>
              </label>
              <input
                name="phoneNumber"
                type="tel"
                className="profile-input"
                value={form.phoneNumber}
                onChange={handleChange}
                disabled={loading}
                placeholder="+213 6XX XX XX XX"
              />
            </div>

            <div className="profile-actions">
              <button type="submit" className="profile-save-btn" disabled={loading || saved}>
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : saved ? (
                  <><CheckCircle size={15} /> Saved</>
                ) : (
                  <><Save size={15} /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
