import React, { useState, useEffect, useCallback } from 'react';
import { useRequester } from '../context/RequesterContext';
import { useNavigate } from 'react-router-dom';

interface Category {
  id: number;
  name: string;
}

interface Ticket {
  id: number;
  ticketNumber: string;
  summary: string;
  status: string;
  requestedPriority: string;
  updatedAt?: string;
  createdAt: string;
  category: { id: number; name: string };
  requester: { id: number; name: string };
}

interface Meta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// ── helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const PriorityBadge: React.FC<{ value: string }> = ({ value }) => {
  const map: Record<string, { label: string; bg: string; color: string; border: string }> = {
    LOW:      { label: 'Low',    bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
    MEDIUM:   { label: 'Medium', bg: '#FFFBEB', color: '#92400E', border: '#FCD34D' },
    HIGH:     { label: 'High',   bg: '#FFF1F2', color: '#9F1239', border: '#FECDD3' },
    CRITICAL: { label: 'High',   bg: '#FFF1F2', color: '#9F1239', border: '#FECDD3' },
  };
  const s = map[value] ?? { label: value, bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' };
  return (
    <span style={{
      display: 'inline-block', fontSize: '0.78rem', fontWeight: 600,
      padding: '3px 12px', borderRadius: '9999px',
      backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>{s.label}</span>
  );
};

const StatusBadge: React.FC<{ value: string }> = ({ value }) => {
  const map: Record<string, { label: string; bg: string; color: string; border: string }> = {
    NEW:         { label: 'Open',        bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    OPEN:        { label: 'Open',        bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    IN_PROGRESS: { label: 'In Progress', bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
    RESOLVED:    { label: 'Resolved',    bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
    CLOSED:      { label: 'Closed',      bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' },
    PENDING:     { label: 'Pending',     bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  };
  const s = map[value] ?? { label: value, bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' };
  return (
    <span style={{
      display: 'inline-block', fontSize: '0.78rem', fontWeight: 600,
      padding: '3px 12px', borderRadius: '9999px',
      backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>{s.label}</span>
  );
};

// Render smart pagination: 1 2 3 4 5 … 6  or  1 … 4 5 6 … 10
const buildPages = (current: number, total: number): (number | '…')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
};

// ── component ────────────────────────────────────────────────────────────────

const MyTickets: React.FC = () => {
  const { selectedRequester } = useRequester();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [reqPriority, setReqPriority] = useState('');
  const [curStatus, setCurStatus] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 8;

  /* ── fetch categories once ── */
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(setCategories)
      .catch(() => {});
  }, []);

  /* ── fetch tickets ── */
  const fetchTickets = useCallback(async () => {
    if (!selectedRequester) return;
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search)      q.set('search', search);
      if (category)    q.set('category', category);
      if (reqPriority) q.set('requestedPriority', reqPriority);
      if (curStatus)   q.set('status', curStatus);

      const res = await fetch(`/api/tickets?${q}`, {
        headers: { 'X-Requester-Id': String(selectedRequester.id) },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setTickets(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch {
      setError('Unable to load tickets. Please try again.');
      setTickets([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [selectedRequester, search, category, reqPriority, curStatus, page]);

  useEffect(() => { setPage(1); }, [selectedRequester]);
  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setReqPriority('');
    setCurStatus('');
    setPage(1);
  };

  const hasFilter = search || category || reqPriority || curStatus;

  // ── styles (inline to avoid touching index.css) ───────────────────────────
  const pageWrap: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, sans-serif",
    backgroundColor: '#F5F7F6',
    minHeight: '100vh',
    padding: '2rem',
  };
  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    marginBottom: '1rem',
  };
  const theadTh: React.CSSProperties = {
    color: '#006B3C',
    fontWeight: 600,
    fontSize: '0.82rem',
    padding: '12px 14px',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid #D1FAE5',
    cursor: 'default',
    userSelect: 'none',
  };
  const tdStyle: React.CSSProperties = {
    padding: '13px 14px',
    fontSize: '0.85rem',
    color: '#374151',
    borderBottom: '1px solid #F3F4F6',
    verticalAlign: 'middle',
  };

  // pagination helpers
  const totalCount = meta?.totalCount ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const from = totalCount === 0 ? 0 : (page - 1) * LIMIT + 1;
  const to   = Math.min(page * LIMIT, totalCount);
  const pages = buildPages(page, totalPages);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div id="my-tickets-page" style={pageWrap}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827', margin: 0 }}>My Tickets</h1>
          <p style={{ color: '#6B7280', fontSize: '0.88rem', margin: '4px 0 0' }}>
            View and track all of your support requests.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            id="btn-clear-filters"
            onClick={clearFilters}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem',
              background: '#fff', border: '1px solid #D1D5DB', color: '#374151', fontWeight: 500,
            }}>
            ↻ Clear Filters
          </button>
          <button
            id="btn-create-ticket"
            onClick={() => navigate('/create-ticket')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem',
              background: '#006B3C', border: 'none', color: '#fff', fontWeight: 600,
            }}>
            + Create Ticket
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ ...cardStyle, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '2', minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: '0.9rem' }}>🔍</span>
          <input
            id="search-input"
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by ticket number or summary..."
            style={{
              width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px',
              border: '1px solid #E5E7EB', fontSize: '0.85rem', outline: 'none',
              background: '#F9FAFB', color: '#111827', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>Category</label>
          <select
            id="category-filter"
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.85rem', background: '#fff', color: '#374151' }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Requested Priority */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>Requested Priority</label>
          <select
            id="req-priority-filter"
            value={reqPriority}
            onChange={e => { setReqPriority(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.85rem', background: '#fff', color: '#374151' }}>
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* IT Priority */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>IT Priority</label>
          <select
            id="it-priority-filter"
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.85rem', background: '#fff', color: '#374151' }}>
            <option value="">All Priorities</option>
          </select>
        </div>

        {/* Current Status */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>Current Status</label>
          <select
            id="status-filter"
            value={curStatus}
            onChange={e => { setCurStatus(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.85rem', background: '#fff', color: '#374151' }}>
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div id="tickets-error-state" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', color: '#B91C1C', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div id="tickets-loading-state" style={{ ...cardStyle, textAlign: 'center', padding: '4rem' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #E5E7EB', borderTopColor: '#006B3C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>

      /* ── Empty / No-results ── */
      ) : tickets.length === 0 ? (
        <div
          id={hasFilter ? 'tickets-no-results-state' : 'tickets-empty-state'}
          style={{ ...cardStyle, textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '2rem', margin: 0 }}>🎫</p>
          <h5 style={{ color: '#374151', fontWeight: 600, marginTop: '0.5rem' }}>No tickets found</h5>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
            {hasFilter ? 'Try adjusting your search or filters.' : "You haven't submitted any tickets yet."}
          </p>
        </div>

      /* ── Table ── */
      ) : (
        <>
          {/* Desktop table */}
          <div id="tickets-table-desktop" style={{ ...cardStyle, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '10px', overflow: 'hidden' }}>
              <thead style={{ background: '#EAF6EF' }}>
                <tr>
                  <th style={theadTh}>Ticket No. ↕</th>
                  <th style={theadTh}>Created Date ↕</th>
                  <th style={theadTh}>Summary</th>
                  <th style={theadTh}>Category</th>
                  <th style={{ ...theadTh, textAlign: 'center' }}>Requested Priority</th>
                  <th style={{ ...theadTh, textAlign: 'center' }}>IT Priority</th>
                  <th style={{ ...theadTh, textAlign: 'center' }}>Current Status</th>
                  <th style={theadTh}>Ticket Owner</th>
                  <th style={theadTh}>Last Updated ↕</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t, idx) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    style={{ cursor: 'pointer', background: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F0FDF4')}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#FAFAFA')}
                  >
                    <td style={{ ...tdStyle, color: '#006B3C', fontWeight: 700 }}>{t.ticketNumber}</td>
                    <td style={tdStyle}>{fmtDate(t.createdAt)}</td>
                    <td style={tdStyle}>{t.summary}</td>
                    <td style={tdStyle}>{t.category?.name ?? '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><PriorityBadge value={t.requestedPriority} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><PriorityBadge value={t.requestedPriority} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><StatusBadge value={t.status} /></td>
                    <td style={tdStyle}>{t.requester?.name ?? '—'}</td>
                    <td style={tdStyle}>{fmtDate(t.updatedAt ?? t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div id="tickets-list-mobile">
            {tickets.map(t => (
              <div key={t.id} style={{ ...cardStyle, padding: '1rem', cursor: 'pointer' }} onClick={() => navigate(`/tickets/${t.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#006B3C', fontWeight: 700, fontSize: '0.9rem' }}>{t.ticketNumber}</span>
                  <StatusBadge value={t.status} />
                </div>
                <div style={{ fontSize: '0.88rem', color: '#374151', marginBottom: '4px' }}>{t.summary}</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t.category?.name}</span>
                  <PriorityBadge value={t.requestedPriority} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          {meta && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.84rem', color: '#6B7280' }}>
                Showing {from} to {to} of {totalCount} tickets
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {/* Previous */}
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff',
                    cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '0.84rem', color: page === 1 ? '#9CA3AF' : '#374151',
                  }}>
                  ‹ Previous
                </button>

                {pages.map((p, i) =>
                  p === '…' ? (
                    <span key={`e${i}`} style={{ padding: '6px 10px', fontSize: '0.84rem', color: '#6B7280' }}>…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(Number(p))}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', border: '1px solid',
                        borderColor: p === page ? '#006B3C' : '#E5E7EB',
                        background: p === page ? '#006B3C' : '#fff',
                        color: p === page ? '#fff' : '#374151',
                        fontWeight: p === page ? 700 : 400,
                        cursor: 'pointer', fontSize: '0.84rem',
                      }}>
                      {p}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.84rem', color: page === totalPages ? '#9CA3AF' : '#374151',
                  }}>
                  Next ›
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyTickets;
