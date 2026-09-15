import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ChangePassword: React.FC = () => {
  const { changePassword, user } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string; general?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRules = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  ];

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      const failedRules = passwordRules.filter(r => !r.test(newPassword));
      if (failedRules.length > 0) {
        newErrors.newPassword = `Password must have: ${failedRules.map(r => r.label.toLowerCase()).join(', ')}`;
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    const result = await changePassword(newPassword, confirmPassword);

    if (result.success) {
      // Redirect to role-appropriate home
      if (user) {
        switch (user.role) {
          case 'IT_STAFF':
            navigate('/staff/tickets', { replace: true });
            break;
          case 'ADMINISTRATOR':
            navigate('/admin/users', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      } else {
        navigate('/', { replace: true });
      }
    } else {
      setErrors({ general: result.error });
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg, #F5F7F6)',
      padding: '1rem',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        backgroundColor: 'var(--color-surface, #FFFFFF)',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        padding: '2rem',
      }}>
        <h1 style={{
          color: 'var(--color-text, #1A1A1A)',
          fontSize: '1.25rem',
          fontWeight: 600,
          margin: '0 0 0.25rem 0',
        }}>
          Change Your Password
        </h1>
        <p style={{
          color: 'var(--color-text-muted, #6B7280)',
          margin: '0 0 1.5rem 0',
          fontSize: '0.9rem',
        }}>
          You must change your password to continue.
        </p>

        {errors.general && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 4,
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            color: 'var(--color-danger, #DC2626)',
            fontSize: '0.9rem',
          }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Current Password (Visual Match) */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="current-password" style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '0.4rem',
              color: 'var(--color-text, #1A1A1A)',
              fontSize: '0.9rem',
            }}>
              Current (temporary) password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                  borderRadius: 4,
                  border: '1px solid var(--color-border, #D1D5DB)',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9CA3AF' }}>{showCurrentPassword ? '🫣' : '👁'}</span>
            </div>
          </div>

          {/* New Password */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="new-password" style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '0.4rem',
              color: 'var(--color-text, #1A1A1A)',
              fontSize: '0.9rem',
            }}>
              New password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                  borderRadius: 4,
                  border: `1px solid ${errors.newPassword ? 'var(--color-danger, #DC2626)' : 'var(--color-border, #D1D5DB)'}`,
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9CA3AF' }}>{showNewPassword ? '🫣' : '👁'}</span>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="confirm-password" style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '0.4rem',
              color: 'var(--color-text, #1A1A1A)',
              fontSize: '0.9rem',
            }}>
              Confirm new password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                  borderRadius: 4,
                  border: `1px solid ${errors.confirmPassword ? 'var(--color-danger, #DC2626)' : 'var(--color-border, #D1D5DB)'}`,
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9CA3AF' }}>{showConfirmPassword ? '🫣' : '👁'}</span>
            </div>
            {errors.confirmPassword && (
              <p style={{ color: 'var(--color-danger, #DC2626)', fontSize: '0.85rem', margin: '0.3rem 0 0 0' }}>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Password rules hint box */}
          <div style={{
            backgroundColor: '#ECFDF5',
            borderRadius: 4,
            padding: '1rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text, #1A1A1A)', marginBottom: '0.5rem' }}>
              Password must:
            </div>
            {passwordRules.map((rule, i) => {
              const passed = newPassword.length > 0 && rule.test(newPassword);
              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  color: passed ? 'var(--color-success, #16A34A)' : 'var(--color-text-muted, #6B7280)',
                  marginBottom: '0.25rem',
                }}>
                  <span style={{ marginRight: '0.5rem', opacity: passed ? 1 : 0.5 }}>✓</span>
                  {rule.label}
                </div>
              );
            })}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: submitting ? '#9CA3AF' : 'var(--color-primary, #006B3C)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 4,
              fontSize: '1rem',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => { if (!submitting) (e.target as HTMLButtonElement).style.backgroundColor = 'var(--color-secondary, #0B7A46)'; }}
            onMouseLeave={(e) => { if (!submitting) (e.target as HTMLButtonElement).style.backgroundColor = 'var(--color-primary, #006B3C)'; }}
          >
            {submitting ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
