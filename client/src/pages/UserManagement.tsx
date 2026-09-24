import React, { useState, useEffect, useCallback } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  REQUESTER:     { bg: '#DBEAFE', color: '#1E40AF', label: 'Requester' },
  IT_STAFF:      { bg: '#EDE9FE', color: '#6D28D9', label: 'IT Staff' },
  ADMINISTRATOR: { bg: '#FEE2E2', color: '#991B1B', label: 'Administrator' },
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const s = ROLE_STYLES[role] ?? { bg: '#F3F4F6', color: '#374151', label: role };
  return (
    <span style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: '9999px', backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ── Modal ─────────────────────────────────────────────────────────────────────

interface UserModalProps {
  mode: 'create' | 'edit' | 'reset';
  user?: User | null;
  onClose: () => void;
  onSaved: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ mode, user, onClose, onSaved }) => {
  const isCreate = mode === 'create';
  const isEdit   = mode === 'edit';
  const isReset  = mode === 'reset';

  const [name,     setName]     = useState(isEdit ? (user?.name ?? '') : '');
  const [email,    setEmail]    = useState(isEdit ? (user?.email ?? '') : '');
  const [role,     setRole]     = useState(isEdit ? (user?.role ?? 'REQUESTER') : 'REQUESTER');
  const [isActive, setIsActive] = useState(isEdit ? (user?.isActive ?? true) : true);
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');

  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!isReset) {
      if (!name.trim())  e.name = 'Name is required';
      if (!email.trim()) e.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
      if (!role) e.role = 'Role is required';
    }
    if (isCreate || isReset) {
      if (!password) e.password = 'Password is required';
      else if (password.length < 8) e.password = 'At least 8 characters';
      else if (!/[A-Z]/.test(password)) e.password = 'Must contain uppercase';
      else if (!/[a-z]/.test(password)) e.password = 'Must contain lowercase';
      else if (!/[0-9]/.test(password)) e.password = 'Must contain a number';
      if (!confirm) e.confirmPassword = 'Confirm password';
      else if (password !== confirm) e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setSaving(true);
    try {
      let url = '/api/admin/users';
      let method = 'POST';
      let body: Record<string, unknown> = { name, email, role, password, isActive };

      if (isEdit && user) {
        url = `/api/admin/users/${user.id}`;
        method = 'PATCH';
        body = { name, email, role, isActive };
      } else if (isReset && user) {
        url = `/api/admin/users/${user.id}/reset-password`;
        method = 'POST';
        body = { password, confirmPassword: confirm };
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error?.fields) { setErrors(data.error.fields); }
        else { setApiError(data.error?.message ?? 'An error occurred.'); }
        return;
      }

      onSaved();
      onClose();
    } catch {
      setApiError('Unable to connect. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const title = isCreate ? 'Create User' : isReset ? 'Reset Password' : `Edit User — ${user?.name}`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '2rem',
        width: '100%', maxWidth: '480px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 id="modal-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h2>
          <button id="modal-close-btn" onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
        </div>

        {apiError && (
          <div id="modal-api-error" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', color: '#B91C1C', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {!isReset && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Full Name</label>
                <input id="modal-name" type="text" value={name} onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${errors.name ? '#EF4444' : '#E5E7EB'}`, boxSizing: 'border-box', fontSize: '0.875rem' }} />
                {errors.name && <p id="modal-error-name" style={{ color: '#DC2626', fontSize: '0.78rem', margin: '3px 0 0' }}>{errors.name}</p>}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Email Address</label>
                <input id="modal-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${errors.email ? '#EF4444' : '#E5E7EB'}`, boxSizing: 'border-box', fontSize: '0.875rem' }} />
                {errors.email && <p id="modal-error-email" style={{ color: '#DC2626', fontSize: '0.78rem', margin: '3px 0 0' }}>{errors.email}</p>}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Role</label>
                <select id="modal-role" value={role} onChange={e => setRole(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${errors.role ? '#EF4444' : '#E5E7EB'}`, fontSize: '0.875rem' }}>
                  <option value="REQUESTER">Requester</option>
                  <option value="IT_STAFF">IT Staff</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
                {errors.role && <p id="modal-error-role" style={{ color: '#DC2626', fontSize: '0.78rem', margin: '3px 0 0' }}>{errors.role}</p>}
              </div>
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input id="modal-active" type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <label htmlFor="modal-active" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', cursor: 'pointer' }}>Active account</label>
              </div>
            </>
          )}

          {(isCreate || isReset) && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  {isReset ? 'New Password' : 'Password'}
                </label>
                <input id="modal-password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="min. 8 chars, uppercase, lowercase, number"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${errors.password ? '#EF4444' : '#E5E7EB'}`, boxSizing: 'border-box', fontSize: '0.875rem' }} />
                {errors.password && <p id="modal-error-password" style={{ color: '#DC2626', fontSize: '0.78rem', margin: '3px 0 0' }}>{errors.password}</p>}
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Confirm Password</label>
                <input id="modal-confirm-password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${errors.confirmPassword ? '#EF4444' : '#E5E7EB'}`, boxSizing: 'border-box', fontSize: '0.875rem' }} />
                {errors.confirmPassword && <p id="modal-error-confirm-password" style={{ color: '#DC2626', fontSize: '0.78rem', margin: '3px 0 0' }}>{errors.confirmPassword}</p>}
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button id="modal-cancel-btn" type="button" onClick={onClose}
              style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
              Cancel
            </button>
            <button id="modal-save-btn" type="submit" disabled={saving}
              style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: '#006B3C', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : isReset ? 'Reset Password' : isCreate ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal
  const [modal, setModal] = useState<{ mode: 'create' | 'edit' | 'reset'; user?: User } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (search)     q.set('search', search);
      if (roleFilter) q.set('role', roleFilter);

      const res = await fetch(`/api/admin/users?${q}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {
      setError('Unable to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const card: React.CSSProperties = {
    background: '#fff', borderRadius: '10px',
    border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
  };

  return (
    <div id="user-management" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827', margin: 0 }}>User Management</h1>
          <p style={{ color: '#6B7280', fontSize: '0.88rem', margin: '4px 0 0' }}>
            {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          id="btn-create-user"
          onClick={() => setModal({ mode: 'create' })}
          style={{
            padding: '9px 20px', borderRadius: '8px', border: 'none',
            background: '#006B3C', color: '#fff', fontWeight: 700,
            cursor: 'pointer', fontSize: '0.9rem',
          }}
        >
          + Create User
        </button>
      </div>

      {/* Filters */}
      <div style={{ ...card, padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: '2', minWidth: '200px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Search</label>
          <input
            id="user-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Name or email…"
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Role</label>
          <select id="user-role-filter" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.85rem' }}>
            <option value="">All Roles</option>
            <option value="REQUESTER">Requester</option>
            <option value="IT_STAFF">IT Staff</option>
            <option value="ADMINISTRATOR">Administrator</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', color: '#B91C1C', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #E5E7EB', borderTopColor: '#006B3C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : users.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '4rem' }}>
          <p style={{ fontSize: '1.5rem', margin: 0 }}>👤</p>
          <h3 style={{ color: '#374151', marginTop: '0.5rem', fontWeight: 600 }}>No users found</h3>
        </div>
      ) : (
        <div style={{ ...card, overflowX: 'auto' }}>
          <table id="users-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#EAF6EF' }}>
              <tr>
                <th style={{ color: '#006B3C', fontWeight: 600, fontSize: '0.78rem', padding: '11px 14px', textAlign: 'left', borderBottom: '1px solid #D1FAE5' }}>Name</th>
                <th style={{ color: '#006B3C', fontWeight: 600, fontSize: '0.78rem', padding: '11px 14px', textAlign: 'left', borderBottom: '1px solid #D1FAE5' }}>Email</th>
                <th style={{ color: '#006B3C', fontWeight: 600, fontSize: '0.78rem', padding: '11px 14px', textAlign: 'center', borderBottom: '1px solid #D1FAE5' }}>Role</th>
                <th style={{ color: '#006B3C', fontWeight: 600, fontSize: '0.78rem', padding: '11px 14px', textAlign: 'center', borderBottom: '1px solid #D1FAE5' }}>Status</th>
                <th style={{ color: '#006B3C', fontWeight: 600, fontSize: '0.78rem', padding: '11px 14px', textAlign: 'left', borderBottom: '1px solid #D1FAE5' }}>Created</th>
                <th style={{ color: '#006B3C', fontWeight: 600, fontSize: '0.78rem', padding: '11px 14px', textAlign: 'right', borderBottom: '1px solid #D1FAE5' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id} id={`user-row-${u.id}`} data-email={u.email} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '12px 14px', fontSize: '0.875rem', color: '#111827', fontWeight: 600, borderBottom: '1px solid #F3F4F6' }}>
                    {u.name}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #F3F4F6' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
                    <RoleBadge role={u.role} />
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
                    <span style={{
                      display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: '9999px',
                      backgroundColor: u.isActive ? '#DCFCE7' : '#F3F4F6',
                      color: u.isActive ? '#14532D' : '#6B7280',
                    }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
                    {fmtDate(u.createdAt)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        id={`btn-edit-user-${u.id}`}
                        onClick={() => setModal({ mode: 'edit', user: u })}
                        style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}
                      >
                        Edit
                      </button>
                      <button
                        id={`btn-reset-password-${u.id}`}
                        onClick={() => setModal({ mode: 'reset', user: u })}
                        style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #FCD34D', background: '#FFFBEB', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#92400E' }}
                      >
                        Reset PW
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <UserModal
          mode={modal.mode}
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={fetchUsers}
        />
      )}
    </div>
  );
};

export default UserManagement;
