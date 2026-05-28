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
    if (!form.firstName.trim())  errs.firstName = 'First name is required';
    if (!form.lastName.trim())   errs.lastName  = 'Last name is required';
    if (!form.username.trim())   errs.username  = 'Username is required';
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
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
      showToast('success', 'Account created successfully! Welcome 🎉');
      navigate('/home', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast('error', msg ?? 'An error occurred while creating the account.');
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
            Join the LinSoft event community
          </h2>
          <ul className="auth-brand__features">
            <li>🚀 Free and fast registration</li>
            <li>📅 Access all events</li>
            <li>🔔 Personalized notifications</li>
            <li>🎫 Manage your registrations easily</li>
          </ul>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-panel auth-panel--form">
        <div className="auth-form-container auth-form-container--wide">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Create an Account</h1>
            <p className="auth-form-subtitle">
              Already registered?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Name row */}
            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label">First Name *</label>
                <div className="auth-input-wrap">
                  <User size={15} className="auth-input-icon" />
                  <input
                    name="firstName" type="text" className={`auth-input${errors.firstName ? ' auth-input--error' : ''}`}
                    placeholder="First name" value={form.firstName} onChange={handleChange} disabled={loading}
                  />
                </div>
                {errors.firstName && <span className="auth-error">{errors.firstName}</span>}
              </div>
              <div className="auth-field">
                <label className="auth-label">Last Name *</label>
                <div className="auth-input-wrap">
                  <User size={15} className="auth-input-icon" />
                  <input
                    name="lastName" type="text" className={`auth-input${errors.lastName ? ' auth-input--error' : ''}`}
                    placeholder="Last name" value={form.lastName} onChange={handleChange} disabled={loading}
                  />
                </div>
                {errors.lastName && <span className="auth-error">{errors.lastName}</span>}
              </div>
            </div>

            {/* Username */}
            <div className="auth-field">
              <label className="auth-label">Username *</label>
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
              <label className="auth-label">Phone <span className="auth-optional">(optional)</span></label>
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
                <label className="auth-label">Password *</label>
                <div className="auth-input-wrap">
                  <Lock size={15} className="auth-input-icon" />
                  <input
                    name="password" type={showPwd ? 'text' : 'password'}
                    className={`auth-input auth-input--has-toggle${errors.password ? ' auth-input--error' : ''}`}
                    placeholder="Min. 8 characters" value={form.password} onChange={handleChange} disabled={loading}
                  />
                  <button type="button" className="auth-pwd-toggle" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && <span className="auth-error">{errors.password}</span>}
              </div>
              <div className="auth-field">
                <label className="auth-label">Confirm *</label>
                <div className="auth-input-wrap">
                  <Lock size={15} className="auth-input-icon" />
                  <input
                    name="confirmPassword" type={showPwd ? 'text' : 'password'}
                    className={`auth-input${errors.confirmPassword ? ' auth-input--error' : ''}`}
                    placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} disabled={loading}
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
                  {form.password.length >= 8 ? 'Strong' : form.password.length >= 6 ? 'Medium' : 'Weak'}
                </span>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : <><UserPlus size={16} /> Create Account</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
