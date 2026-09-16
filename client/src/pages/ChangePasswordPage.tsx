import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { Clock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

const ChangePasswordPage: React.FC = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string; currentPassword?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const roleHome = (role: UserRole): string => {
    if (role === 'IT_STAFF')      return '/staff/tickets';
    if (role === 'ADMINISTRATOR') return '/admin/users';
    return '/';
  };

  const validate = (): boolean => {
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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // The API only expects newPassword and confirmPassword
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (res.status === 400) {
        const fieldErrors: { newPassword?: string; confirmPassword?: string } = {};
        if (data.error?.fields?.newPassword) fieldErrors.newPassword = data.error.fields.newPassword;
        if (data.error?.fields?.confirmPassword) fieldErrors.confirmPassword = data.error.fields.confirmPassword;
        if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
        setApiError(data.error?.message ?? 'Validation error');
        return;
      }
      if (!res.ok) {
        setApiError('Unable to change password. Please try again.');
        return;
      }

      setUser(data.user);
      navigate(roleHome(data.user.role), { replace: true });
    } catch {
      setApiError('Unable to connect. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Check validation rules for visual feedback
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
      {/* Top Green Banner (optional, just to keep consistent with login if needed) */}
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}>
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
          {apiError && (
            <div style={{
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '6px', padding: '12px 16px',
              color: '#991B1B', fontSize: '0.875rem', marginBottom: '1.25rem',
              display: 'flex', alignItems: 'flex-start', gap: '8px'
            }}>
              <AlertCircle size={18} color="#DC2626" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>{apiError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
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
                  onChange={e => { setCurrentPassword(e.target.value); setErrors(ev => ({ ...ev, currentPassword: undefined })); }}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 40px 10px 12px', borderRadius: '6px',
                    border: `1px solid ${errors.currentPassword ? '#EF4444' : '#D1D5DB'}`,
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
              {errors.currentPassword && (
                <p style={{ color: '#DC2626', fontSize: '0.8rem', margin: '4px 0 0' }}>{errors.currentPassword}</p>
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
                  onChange={e => { setNewPassword(e.target.value); setErrors(ev => ({ ...ev, newPassword: undefined })); }}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 40px 10px 12px', borderRadius: '6px',
                    border: `1px solid ${errors.newPassword ? '#EF4444' : '#D1D5DB'}`,
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
              {errors.newPassword && (
                <p style={{ color: '#DC2626', fontSize: '0.8rem', margin: '4px 0 0' }}>{errors.newPassword}</p>
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
                  onChange={e => { setConfirmPassword(e.target.value); setErrors(ev => ({ ...ev, confirmPassword: undefined })); }}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 40px 10px 12px', borderRadius: '6px',
                    border: `1px solid ${errors.confirmPassword ? '#EF4444' : '#D1D5DB'}`,
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
              {errors.confirmPassword && (
                <p style={{ color: '#DC2626', fontSize: '0.8rem', margin: '4px 0 0' }}>{errors.confirmPassword}</p>
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
              disabled={loading}
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                backgroundColor: '#005831',
                border: 'none', color: '#fff', fontSize: '0.9rem',
                fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
