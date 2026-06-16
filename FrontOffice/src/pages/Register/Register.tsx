import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Phone, User, UserPlus } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../Login/Auth.css';

interface FormState {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
}

const INITIAL: FormState = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  phoneNumber: '',
};

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = (): boolean => {
    const errs: Partial<FormState> = {};
    if (!form.firstName.trim())  errs.firstName = 'Le prénom est requis';
    if (!form.lastName.trim())   errs.lastName  = 'Le nom est requis';
    if (!form.username.trim())   errs.username  = 'Le nom d\'utilisateur est requis';
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email invalide';
    if (form.password.length < 8) errs.password = 'Minimum 8 caractères';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        firstName:   form.firstName.trim(),
        lastName:    form.lastName.trim(),
        username:    form.username.trim(),
        email:       form.email.trim(),
        password:    form.password,
        phoneNumber: form.phoneNumber.trim() || undefined,
      });
      showToast('success', 'Compte créé avec succès ! Bienvenue 🎉');
      navigate('/home', { replace: true });
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const status = e?.response?.status;
      const backendMsg = e?.response?.data?.message;
      let msg: string;
      if (status === 409) {
        // Conflit : nom d'utilisateur ou email déjà pris
        msg = 'Ce nom d\'utilisateur ou cet email est déjà utilisé. Essayez de vous connecter ou choisissez d\'autres identifiants.';
      } else {
        msg = backendMsg ?? 'Une erreur est survenue lors de la création du compte.';
      }
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--register">
      {/* Left panel */}
      <div className="auth-panel auth-panel--brand">
        <div className="auth-brand">
          <div className="auth-brand__logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
              <rect width="48" height="48" rx="12" fill="#FF5276"/>
              <path d="M14 34V14l10 10 10-10v20" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Event Management</span>
          </div>
          <h2 className="auth-brand__tagline">
            Rejoignez la communauté événementielle LinSoft
          </h2>
          <ul className="auth-brand__features">
            <li>🚀 Inscription gratuite et rapide</li>
            <li>📅 Accédez à tous les événements</li>
            <li>🔔 Notifications personnalisées</li>
            <li>🎫 Gérez facilement vos inscriptions</li>
          </ul>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-panel auth-panel--form">
        <div className="auth-form-container auth-form-container--wide">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Créer un compte</h1>
            <p className="auth-form-subtitle">
              Déjà inscrit ?{' '}
              <Link to="/login" className="auth-link">Se connecter</Link>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Name row */}
            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label">Prénom *</label>
                <div className="auth-input-wrap">
                  <User size={15} className="auth-input-icon" />
                  <input
                    name="firstName" type="text" className={`auth-input${errors.firstName ? ' auth-input--error' : ''}`}
                    placeholder="Prénom" value={form.firstName} onChange={handleChange} disabled={loading}
                  />
                </div>
                {errors.firstName && <span className="auth-error">{errors.firstName}</span>}
              </div>
              <div className="auth-field">
                <label className="auth-label">Nom *</label>
                <div className="auth-input-wrap">
                  <User size={15} className="auth-input-icon" />
                  <input
                    name="lastName" type="text" className={`auth-input${errors.lastName ? ' auth-input--error' : ''}`}
                    placeholder="Nom" value={form.lastName} onChange={handleChange} disabled={loading}
                  />
                </div>
                {errors.lastName && <span className="auth-error">{errors.lastName}</span>}
              </div>
            </div>

            {/* Username */}
            <div className="auth-field">
              <label className="auth-label">Nom d'utilisateur *</label>
              <div className="auth-input-wrap">
                <span className="auth-input-prefix">@</span>
                <input
                  name="username" type="text" className={`auth-input auth-input--prefixed${errors.username ? ' auth-input--error' : ''}`}
                  placeholder="john.doe" value={form.username} onChange={handleChange} disabled={loading}
                />
              </div>
              {errors.username && <span className="auth-error">{errors.username}</span>}
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">Email *</label>
              <div className="auth-input-wrap">
                <Mail size={15} className="auth-input-icon" />
                <input
                  name="email" type="email" className={`auth-input${errors.email ? ' auth-input--error' : ''}`}
                  placeholder="you@example.com" value={form.email} onChange={handleChange} disabled={loading}
                />
              </div>
              {errors.email && <span className="auth-error">{errors.email}</span>}
            </div>

            {/* Phone */}
            <div className="auth-field">
              <label className="auth-label">Téléphone <span className="auth-optional">(optionnel)</span></label>
              <div className="auth-input-wrap">
                <Phone size={15} className="auth-input-icon" />
                <input
                  name="phoneNumber" type="tel" className="auth-input"
                  placeholder="+216 XX XXX XXX" value={form.phoneNumber} onChange={handleChange} disabled={loading}
                />
              </div>
            </div>

            {/* Password row */}
            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label">Mot de passe *</label>
                <div className="auth-input-wrap">
                  <Lock size={15} className="auth-input-icon" />
                  <input
                    name="password" type={showPwd ? 'text' : 'password'}
                    className={`auth-input auth-input--has-toggle${errors.password ? ' auth-input--error' : ''}`}
                    placeholder="Min. 8 caractères" value={form.password} onChange={handleChange} disabled={loading}
                  />
                  <button type="button" className="auth-pwd-toggle" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && <span className="auth-error">{errors.password}</span>}
              </div>
              <div className="auth-field">
                <label className="auth-label">Confirmer *</label>
                <div className="auth-input-wrap">
                  <Lock size={15} className="auth-input-icon" />
                  <input
                    name="confirmPassword" type={showPwd ? 'text' : 'password'}
                    className={`auth-input${errors.confirmPassword ? ' auth-input--error' : ''}`}
                    placeholder="Répéter le mot de passe" value={form.confirmPassword} onChange={handleChange} disabled={loading}
                  />
                </div>
                {errors.confirmPassword && <span className="auth-error">{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* Password strength */}
            {form.password && (
              <div className="auth-strength">
                <div className="auth-strength__bar">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`auth-strength__segment${form.password.length >= (i + 1) * 2 ? ' auth-strength__segment--active' : ''}`}
                      style={{
                        backgroundColor: form.password.length >= 8 ? '#27ae60' :
                                         form.password.length >= 6 ? '#e67e22' : '#e74c3c'
                      }}
                    />
                  ))}
                </div>
                <span className="auth-strength__label">
                  {form.password.length >= 8 ? 'Fort' : form.password.length >= 6 ? 'Moyen' : 'Faible'}
                </span>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : <><UserPlus size={16} /> Créer un compte</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
