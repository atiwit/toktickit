import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { Clock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  // Login State
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginErrors, setLoginErrors]     = useState<{ email?: string; password?: string }>({});
  const [loginApiError, setLoginApiError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading]   = useState(false);

  // Change Password State
  const [showChangePasswordCard, setShowChangePasswordCard] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cpErrors, setCpErrors] = useState<{ newPassword?: string; confirmPassword?: string; currentPassword?: string }>({});
  const [cpApiError, setCpApiError] = useState<string | null>(null);
  const [cpLoading, setCpLoading]   = useState(false);

  const roleHome = (role: UserRole): string => {
    if (role === 'IT_STAFF')      return '/staff/tickets';
    if (role === 'ADMINISTRATOR') return '/admin/users';
    return '/';  // REQUESTER
  };

  // --- Login Logic ---
  const validateLogin = (): boolean => {
    const e: { email?: string; password?: string } = {};
    if (!email.trim())    e.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address';
    if (!password.trim()) e.password = 'Password is required';
    setLoginErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginApiError(null);
    if (!validateLogin()) return;

    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 400) {
        setLoginApiError('Invalid email or password.\nPlease try again.');
        return;
      }
      if (res.status === 403) {
        setLoginApiError(data.error?.message ?? 'Your account is inactive. Please contact an administrator.');
        return;
      }
      if (!res.ok) {
        setLoginApiError('Unable to connect. Please try again later.');
        return;
      }

      const user = data.user;
      setUser(user);

      if (user.mustChangePassword) {
        // Show change password card below!
        setShowChangePasswordCard(true);
        // Pre-fill current password if we want (or leave blank)
        setCurrentPassword(password);
      } else {
        navigate(roleHome(user.role), { replace: true });
      }
    } catch {
      setLoginApiError('Unable to connect. Please try again later.');
    } finally {
      setLoginLoading(false);
    }
  };


  // --- Change Password Logic ---
  const validateCp = (): boolean => {
    const e: { newPassword?: string; confirmPassword?: string; currentPassword?: string } = {};
    if (!currentPassword) {
      e.currentPassword = 'Current password is required';
    }
    if (!newPassword) {
      e.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      e.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword)) {
      e.newPassword = 'Password must include upper and lower case letters';
    } else if (!/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      e.newPassword = 'Password must include a number and a special character';
    }
    
    if (!confirmPassword) {
      e.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      e.confirmPassword = "Passwords don't match";
    }
    setCpErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpApiError(null);
    if (!validateCp()) return;

    setCpLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (res.status === 400) {
        const fieldErrors: { newPassword?: string; confirmPassword?: string } = {};
        if (data.error?.fields?.newPassword) fieldErrors.newPassword = data.error.fields.newPassword;
        if (data.error?.fields?.confirmPassword) fieldErrors.confirmPassword = data.error.fields.confirmPassword;
        if (Object.keys(fieldErrors).length > 0) { setCpErrors(fieldErrors); return; }
        setCpApiError(data.error?.message ?? 'Validation error');
        return;
      }
      if (!res.ok) {
        setCpApiError('Unable to change password. Please try again.');
        return;
      }

      setUser(data.user);
      navigate(roleHome(data.user.role), { replace: true });
    } catch {
      setCpApiError('Unable to connect. Please try again later.');
    } finally {
      setCpLoading(false);
    }
  };

  const hasMinLen = newPassword.length >= 8;
  const hasUpperLower = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);
  const hasNumSpecial = /[0-9]/.test(newPassword) && /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);


  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F9FAFB',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Top Green Banner */}
      <div style={{
        backgroundColor: '#005831',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#fff'
      }}>
        <Clock size={24} />
        <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>TikTockIT</span>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        gap: '24px', // Space between cards
      }}>

        {/* --- SIGN IN CARD --- */}
        <div style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          padding: '2rem',
          border: '1px solid #E5E7EB',
        }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 1.5rem 0' }}>
            Sign in to your account
          </h1>

          <form onSubmit={handleLoginSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="login-email" style={{
                display: 'block', fontSize: '0.875rem', fontWeight: 500,
                color: '#374151', marginBottom: '8px',
              }}>
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setLoginErrors(ev => ({ ...ev, email: undefined })); }}
                placeholder="janderson@tiktockit.com"
                disabled={showChangePasswordCard}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '6px',
                  border: `1px solid ${loginErrors.email ? '#EF4444' : '#D1D5DB'}`,
                  fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                  color: '#111827',
                  backgroundColor: showChangePasswordCard ? '#F3F4F6' : '#fff'
                }}
              />
              {loginErrors.email && (
                <p id="login-email-error" style={{ color: '#DC2626', fontSize: '0.8rem', margin: '4px 0 0' }}>
                  {loginErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="login-password" style={{
                display: 'block', fontSize: '0.875rem', fontWeight: 500,
                color: '#374151', marginBottom: '8px',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLoginErrors(ev => ({ ...ev, password: undefined })); }}
                  placeholder="•••••••••••"
                  disabled={showChangePasswordCard}
                  style={{
                    width: '100%', padding: '10px 40px 10px 12px', borderRadius: '6px',
                    border: `1px solid ${loginErrors.password ? '#EF4444' : '#D1D5DB'}`,
                    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                    color: '#111827',
                    backgroundColor: showChangePasswordCard ? '#F3F4F6' : '#fff'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={showChangePasswordCard}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#9CA3AF', cursor: showChangePasswordCard ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {loginErrors.password && (
                <p id="login-password-error" style={{ color: '#DC2626', fontSize: '0.8rem', margin: '4px 0 0' }}>
                  {loginErrors.password}
                </p>
              )}
            </div>

            {/* API Error Banner */}
            {loginApiError && (
              <div id="login-error-banner" style={{
                backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: '6px', padding: '12px 16px',
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                marginBottom: '1.5rem',
              }}>
                <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ color: '#991B1B', fontSize: '0.875rem', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                  {loginApiError}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loginLoading || showChangePasswordCard}
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                backgroundColor: '#005831',
                border: 'none', color: '#fff', fontSize: '0.9rem',
                fontWeight: 600, cursor: (loginLoading || showChangePasswordCard) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: (loginLoading || showChangePasswordCard) ? 0.8 : 1,
              }}
            >
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <a href="#" style={{ color: '#005831', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 600 }}>
                Forgot your password?
              </a>
            </div>
          </form>
        </div>

        {/* --- CHANGE PASSWORD CARD --- */}
        {showChangePasswordCard && (
          <div style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
            padding: '2rem',
            border: '1px solid #E5E7EB',
          }}>
            
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0' }}>
              Change Your Password
            </h1>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 1.5rem 0' }}>
              You must change your password to continue.
            </p>

            {/* API Error */}
            {cpApiError && (
              <div style={{
                backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: '6px', padding: '12px 16px',
                color: '#991B1B', fontSize: '0.875rem', marginBottom: '1.25rem',
                display: 'flex', alignItems: 'flex-start', gap: '8px'
              }}>
                <AlertCircle size={18} color="#DC2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>{cpApiError}</div>
              </div>
            )}

            <form onSubmit={handleCpSubmit} noValidate>
              {/* Current Password */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="current-password" style={{
                  display: 'block', fontSize: '0.875rem', fontWeight: 500,
                  color: '#374151', marginBottom: '8px',
                }}>
                  Current (temporary) password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="current-password"
                    type={showCurrent ? "text" : "password"}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={e => { setCurrentPassword(e.target.value); setCpErrors(ev => ({ ...ev, currentPassword: undefined })); }}
                    placeholder="••••••••"
                    style={{
                      width: '100%', padding: '10px 40px 10px 12px', borderRadius: '6px',
                      border: `1px solid ${cpErrors.currentPassword ? '#EF4444' : '#D1D5DB'}`,
                      fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                      color: '#111827',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                    }}
                  >
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {cpErrors.currentPassword && (
                  <p style={{ color: '#DC2626', fontSize: '0.8rem', margin: '4px 0 0' }}>{cpErrors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="new-password" style={{
                  display: 'block', fontSize: '0.875rem', fontWeight: 500,
                  color: '#374151', marginBottom: '8px',
                }}>
                  New password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setCpErrors(ev => ({ ...ev, newPassword: undefined })); }}
                    placeholder="••••••••"
                    style={{
                      width: '100%', padding: '10px 40px 10px 12px', borderRadius: '6px',
                      border: `1px solid ${cpErrors.newPassword ? '#EF4444' : '#D1D5DB'}`,
                      fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                      color: '#111827',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                    }}
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {cpErrors.newPassword && (
                  <p style={{ color: '#DC2626', fontSize: '0.8rem', margin: '4px 0 0' }}>{cpErrors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="confirm-password" style={{
                  display: 'block', fontSize: '0.875rem', fontWeight: 500,
                  color: '#374151', marginBottom: '8px',
                }}>
                  Confirm new password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setCpErrors(ev => ({ ...ev, confirmPassword: undefined })); }}
                    placeholder="••••••••"
                    style={{
                      width: '100%', padding: '10px 40px 10px 12px', borderRadius: '6px',
                      border: `1px solid ${cpErrors.confirmPassword ? '#EF4444' : '#D1D5DB'}`,
                      fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                      color: '#111827',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                    }}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {cpErrors.confirmPassword && (
                  <p style={{ color: '#DC2626', fontSize: '0.8rem', margin: '4px 0 0' }}>{cpErrors.confirmPassword}</p>
                )}
              </div>

              {/* Password rules hint */}
              <div style={{
                backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7',
                borderRadius: '6px', padding: '16px', marginBottom: '1.5rem',
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#065F46', marginBottom: '8px' }}>
                  Password must:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: hasMinLen ? '#059669' : '#4B5563', marginBottom: '6px' }}>
                    <Check size={14} color={hasMinLen ? '#10B981' : '#9CA3AF'} /> Be at least 8 characters
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: hasUpperLower ? '#059669' : '#4B5563', marginBottom: '6px' }}>
                    <Check size={14} color={hasUpperLower ? '#10B981' : '#9CA3AF'} /> Include upper and lower case letters
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: hasNumSpecial ? '#059669' : '#4B5563' }}>
                    <Check size={14} color={hasNumSpecial ? '#10B981' : '#9CA3AF'} /> Include a number and a special character
                  </li>
                </ul>
              </div>

              <button
                id="change-password-submit"
                type="submit"
                disabled={cpLoading}
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px',
                  backgroundColor: '#005831',
                  border: 'none', color: '#fff', fontSize: '0.9rem',
                  fontWeight: 600, cursor: cpLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: cpLoading ? 0.8 : 1,
                }}
              >
                {cpLoading ? 'Saving...' : 'Continue'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
