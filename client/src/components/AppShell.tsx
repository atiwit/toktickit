import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, roleLabel } from '../context/AuthContext';
import { Clock, FileText, PlusCircle, ListChecks, Users, LogOut, Menu, X, ChevronDown } from 'lucide-react';

const AppShell: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  // Role-specific nav items (FR-06, ui-spec §2.3)
  const navItems = React.useMemo(() => {
    if (!user) return [];
    if (user.role === 'REQUESTER') return [
      { to: '/', label: 'My Tickets', icon: <FileText size={18} />, end: true },
      { to: '/create-ticket', label: 'Create Ticket', icon: <PlusCircle size={18} />, end: false },
    ];
    if (user.role === 'IT_STAFF') return [
      { to: '/staff/tickets', label: 'Ticket Queue', icon: <ListChecks size={18} />, end: false },
    ];
    if (user.role === 'ADMINISTRATOR') return [
      { to: '/admin/users', label: 'User Management', icon: <Users size={18} />, end: false },
    ];
    return [];
  }, [user]);

  const roleBadgeColor = (role: string) => {
    if (role === 'IT_STAFF') return { bg: '#EDE9FE', color: '#6D28D9' };
    if (role === 'ADMINISTRATOR') return { bg: '#FEE2E2', color: '#991B1B' };
    return { bg: '#DBEAFE', color: '#1E40AF' };  // REQUESTER
  };

  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 14px', borderRadius: '8px',
    fontSize: '0.9rem', fontWeight: isActive ? 700 : 500,
    color: isActive ? '#fff' : 'rgba(255,255,255,0.85)',
    backgroundColor: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.15s',
  });

  return (
    <div className="app-shell" style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* ── Top Navbar ── */}
      <nav style={{
        backgroundColor: 'var(--color-primary)',
        padding: '0 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '60px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Brand */}
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#fff', fontWeight: 800, fontSize: '1.3rem' }}>
          <Clock size={26} />
          TokTickIT
        </NavLink>

        {/* Desktop nav items (only rendered for correct role, not hidden) */}
        {!loading && user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="desktop-nav">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end} style={navLinkStyle}>
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        )}

        {/* Right: user info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user && (
            <div style={{ position: 'relative' }}>
              <button
                id="profile-dropdown-toggle"
                onClick={() => setProfileOpen(o => !o)}
                style={{
                  background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 12px', cursor: 'pointer', color: '#fff',
                  fontSize: '0.875rem', fontWeight: 600,
                }}
              >
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.85rem',
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hide-mobile">{user.name}</span>
                <ChevronDown size={14} style={{ opacity: 0.7 }} />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: '6px',
                  backgroundColor: '#fff', border: '1px solid var(--color-border)',
                  borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  minWidth: '220px', overflow: 'hidden', zIndex: 200,
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>{user.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>{user.email}</div>
                    {(() => {
                      const c = roleBadgeColor(user.role);
                      return (
                        <span style={{
                          display: 'inline-block', fontSize: '0.72rem', fontWeight: 700,
                          padding: '2px 10px', borderRadius: '9999px',
                          backgroundColor: c.bg, color: c.color,
                        }}>
                          {roleLabel(user.role)}
                        </span>
                      );
                    })()}
                  </div>
                  <button
                    id="logout-button"
                    onClick={handleLogout}
                    style={{
                      width: '100%', padding: '11px 16px', border: 'none',
                      background: 'none', textAlign: 'left', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      fontSize: '0.875rem', color: '#DC2626', fontWeight: 600,
                    }}
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hamburger for mobile */}
          {user && (
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(o => !o)}
              style={{
                background: 'none', border: 'none', color: '#fff',
                cursor: 'pointer', padding: '4px',
                display: 'none',  // controlled by CSS media query
              }}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile slide-out nav */}
      {mobileOpen && user && (
        <div style={{
          backgroundColor: 'var(--color-primary)',
          padding: '0.5rem 1rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
        }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={navLinkStyle}
              onClick={() => setMobileOpen(false)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
      )}

      {/* Click outside to close profile dropdown */}
      {profileOpen && (
        <div
          onClick={() => setProfileOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 90 }}
        />
      )}

      {/* Main Content */}
      <main style={{ padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default AppShell;
