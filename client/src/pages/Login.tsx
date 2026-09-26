import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    const result = await login(email.trim(), password);

    if (result.success && result.user) {
      if (result.user.mustChangePassword) {
        navigate('/change-password', { replace: true });
      } else {
        // Redirect to role-appropriate home
        switch (result.user.role) {
          case 'IT_STAFF':
            navigate('/staff/tickets', { replace: true });
            break;
          case 'ADMINISTRATOR':
            navigate('/admin/users', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
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
        overflow: 'hidden',
      }}>
        {/* Top Banner */}
        <div style={{
          backgroundColor: 'var(--color-primary, #006B3C)',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span style={{ fontSize: '1.5rem' }}>🕑</span>
          <h1 style={{
            color: '#FFFFFF',
            fontSize: '1.25rem',
            fontWeight: 600,
            margin: 0,
          }}>
            TokTickIT
          </h1>
        </div>

        <div style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text, #1A1A1A)', margin: '0 0 1.5rem 0' }}>
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="login-email" style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: '0.4rem',
                color: 'var(--color-text, #1A1A1A)',
                fontSize: '0.9rem',
              }}>
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="janderson@toktickit.com"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 4,
                  border: `1px solid ${errors.email ? 'var(--color-danger, #DC2626)' : 'var(--color-border, #D1D5DB)'}`,
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary, #006B3C)'}
                onBlur={(e) => e.target.style.borderColor = errors.email ? 'var(--color-danger, #DC2626)' : 'var(--color-border, #D1D5DB)'}
              />
              {errors.email && (
                <p style={{ color: 'var(--color-danger, #DC2626)', fontSize: '0.85rem', marginTop: '0.3rem', margin: '0.3rem 0 0 0' }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="login-password" style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: '0.4rem',
                color: 'var(--color-text, #1A1A1A)',
                fontSize: '0.9rem',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                    borderRadius: 4,
                    border: `1px solid ${errors.password ? 'var(--color-danger, #DC2626)' : 'var(--color-border, #D1D5DB)'}`,
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary, #006B3C)'}
                  onBlur={(e) => e.target.style.borderColor = errors.password ? 'var(--color-danger, #DC2626)' : 'var(--color-border, #D1D5DB)'}
                />
                <span 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: '#9CA3AF',
                  }}
                >
                  {showPassword ? '🫣' : '👁'}
                </span>
              </div>
              {errors.password && (
                <p style={{ color: 'var(--color-danger, #DC2626)', fontSize: '0.85rem', marginTop: '0.3rem', margin: '0.3rem 0 0 0' }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* General error */}
            {errors.general && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 4,
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                color: 'var(--color-danger, #DC2626)',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}>
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>❗</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Invalid email or password.</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.1rem' }}>Please try again.</div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              id="login-submit"
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
              {submitting ? 'Logging in…' : 'Sign In'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <a href="#" style={{ color: 'var(--color-primary, #006B3C)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                Forgot your password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
