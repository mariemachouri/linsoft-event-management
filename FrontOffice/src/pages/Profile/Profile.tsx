import { useEffect, useState } from 'react';
import { CheckCircle, Mail, Phone, Save, User } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/auth.service';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const auth = { user };
  const { showToast } = useToast();

  const [form, setForm] = useState({
    firstName:   auth.user?.firstName   ?? '',
    lastName:    auth.user?.lastName    ?? '',
    phoneNumber: auth.user?.phoneNumber ?? '',
  });
  const [loading,  setLoading]  = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    setForm({
      firstName:   auth.user?.firstName   ?? '',
      lastName:    auth.user?.lastName    ?? '',
      phoneNumber: auth.user?.phoneNumber ?? '',
    });
  }, [auth.user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.user?.id) return;

    if (!form.firstName.trim() || !form.lastName.trim()) {
      showToast('warning', 'First name and last name are required.');
      return;
    }

    setLoading(true);
    try {
      const updated = await authService.updateProfile(auth.user.id, {
        firstName:   form.firstName.trim(),
        lastName:    form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
      });
      updateUser(updated);
      setSaved(true);
      showToast('success', 'Profile updated successfully!');
    } catch {
      showToast('error', 'Error updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  const initials = [auth.user?.firstName?.[0], auth.user?.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || auth.user?.username?.[0]?.toUpperCase() || '?';

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="profile-hero__inner">
          <div className="profile-avatar">
            <span>{initials}</span>
          </div>
          <div>
            <h1 className="profile-hero__name">
              {form.firstName || auth.user?.firstName} {form.lastName || auth.user?.lastName}
            </h1>
            <p className="profile-hero__username">@{auth.user?.username}</p>
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
                  value={auth.user?.email ?? ''}
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
                  value={auth.user?.username ?? ''}
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
