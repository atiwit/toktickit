import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface StaffTicket {
  id: number;
  ticketNumber: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
  category: { id: number; name: string };
  requestedPriority: string;
  itPriority: string;
  status: string;
  requester: { id: number; name: string };
  owner: { id: number; name: string } | null;
}

interface Pagination {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ── Badge helpers ────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  LOW:      { bg: '#ECFDF5', color: '#065F46', label: 'Low' },
  MEDIUM:   { bg: '#FFFBEB', color: '#92400E', label: 'Medium' },
  HIGH:     { bg: '#FFF1F2', color: '#9F1239', label: 'High' },
  CRITICAL: { bg: '#FEF2F2', color: '#7F1D1D', label: 'Critical' },
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  NEW:                   { bg: '#EFF6FF', color: '#1D4ED8', label: 'New' },
  OPEN:                  { bg: '#FEF3C7', color: '#92400E', label: 'Open' },
  IN_PROGRESS:           { bg: '#F5F3FF', color: '#5B21B6', label: 'In Progress' },
  WAITING_FOR_REQUESTER: { bg: '#FFF7ED', color: '#C2410C', label: 'Waiting' },
  RESOLVED:              { bg: '#ECFDF5', color: '#065F46', label: 'Resolved' },
  CLOSED:                { bg: '#F3F4F6', color: '#374151', label: 'Closed' },
  REOPENED:              { bg: '#FEF2F2', color: '#991B1B', label: 'Reopened' },
  CANCELLED:             { bg: '#F9FAFB', color: '#6B7280', label: 'Cancelled' },
};

const PBadge: React.FC<{ v: string }> = ({ v }) => {
  const s = PRIORITY_STYLES[v] ?? { bg: '#F3F4F6', color: '#374151', label: v };
  return (
    <span style={{
      display: 'inline-block', fontSize: '0.75rem', fontWeight: 700,
      padding: '2px 10px', borderRadius: '9999px',
      backgroundColor: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
};

const SBadge: React.FC<{ v: string }> = ({ v }) => {
  const s = STATUS_STYLES[v] ?? { bg: '#F3F4F6', color: '#374151', label: v };
  return (
    <span style={{
      display: 'inline-block', fontSize: '0.75rem', fontWeight: 700,
      padding: '2px 10px', borderRadius: '9999px',
      backgroundColor: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ── Skeleton loader ──────────────────────────────────────────────────────────

const SkeletonRow: React.FC = () => (
  <tr>
    {Array.from({ length: 10 }).map((_, i) => (
      <td key={i} style={{ padding: '14px' }}>
        <span style={{
          display: 'block', height: '14px', borderRadius: '6px',
          backgroundColor: '#E5E7EB', width: i === 2 ? '80%' : '60%',
          animation: 'pulse 1.4s ease-in-out infinite',
        }} />
      </td>
    ))}
  </tr>
);

// ── Component ────────────────────────────────────────────────────────────────

const StaffTicketQueue: React.FC = () => {
  const navigate = useNavigate();

  const [tickets, setTickets]       = useState<StaffTicket[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Filters / sort / page
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');
  const [itPriority, setItPriority] = useState('');
  const [ownerId, setOwnerId]       = useState('');
  const [sort, setSort]             = useState('createdAt_desc');
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(10);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort });
      if (search)     q.set('search', search);
      if (status)     q.set('status', status);
      if (itPriority) q.set('itPriority', itPriority);
      if (ownerId)    q.set('ownerId', ownerId);

      const res = await fetch(`/api/staff/tickets?${q}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setPagination(data.pagination ?? null);
    } catch {
      setError('Unable to load ticket queue. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, status, itPriority, ownerId, sort, page, pageSize]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const clearFilters = () => {
    setSearch(''); setStatus(''); setItPriority(''); setOwnerId('');
    setSort('createdAt_desc'); setPage(1);
  };

  const hasFilter = !!(search || status || itPriority || ownerId);

  const sortToggle = (field: string) => {
    const dir = sort === `${field}_desc` ? 'asc' : 'desc';
    setSort(`${field}_${dir}`);
    setPage(1);
  };

  const sortIcon = (field: string) => {
    if (sort === `${field}_desc`) return ' ↓';
    if (sort === `${field}_asc`)  return ' ↑';
    return '';
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: '#fff', borderRadius: '10px',
    border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
  };
  const th: React.CSSProperties = {
    color: '#006B3C', fontWeight: 600, fontSize: '0.78rem',
    padding: '11px 14px', whiteSpace: 'nowrap',
    borderBottom: '1px solid #D1FAE5', userSelect: 'none',
  };
  const td: React.CSSProperties = {
    padding: '12px 14px', fontSize: '0.84rem', color: '#374151',
    borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle',
  };

  return (
    <div id="staff-ticket-queue" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { #queue-table-desktop { display: none !important; } }
        @media (min-width: 769px) { #queue-list-mobile   { display: none !important; } }
      `}</style>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827', margin: 0 }}>Ticket Queue</h1>
          <p style={{ color: '#6B7280', fontSize: '0.88rem', margin: '4px 0 0' }}>
            {pagination ? `${pagination.totalCount} ticket${pagination.totalCount !== 1 ? 's' : ''} total` : ''}
          </p>
        </div>
        {hasFilter && (
          <button
            id="btn-clear-filters"
            onClick={clearFilters}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: '1px solid #D1D5DB',
              background: '#fff', color: '#374151', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
            }}
          >
            ↻ Clear Filters
          </button>
        )}
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div style={{ ...card, padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        {/* Search */}
        <div style={{ flex: '2', minWidth: '200px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Search</label>
          <input
            id="queue-search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Ticket number or summary…"
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>

        {/* Status */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Status</label>
          <select
            id="queue-status-filter"
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REOPENED">Reopened</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* IT Priority */}
        <div style={{ flex: '1', minWidth: '130px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>IT Priority</label>
          <select
            id="queue-priority-filter"
            value={itPriority}
            onChange={e => { setItPriority(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.85rem' }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* Owner */}
        <div style={{ flex: '1', minWidth: '130px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Owner</label>
          <select
            id="queue-owner-filter"
            value={ownerId}
            onChange={e => { setOwnerId(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.85rem' }}
          >
            <option value="">All</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', color: '#B91C1C', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button
            onClick={fetchQueue}
            style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading skeleton ──────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ ...card, overflowX: 'auto', marginBottom: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : tickets.length === 0 ? (
        /* ── Empty / No-results ─────────────────────────────────────────── */
        <div
          id={hasFilter ? 'queue-no-results-state' : 'queue-empty-state'}
          style={{ ...card, textAlign: 'center', padding: '4rem 2rem' }}
        >
          <p style={{ fontSize: '2.5rem', margin: 0 }}>{hasFilter ? '🔍' : '📋'}</p>
          <h3 style={{ color: '#374151', fontWeight: 600, marginTop: '0.75rem' }}>
            {hasFilter ? 'No tickets match your search or filters' : 'No tickets in the queue'}
          </h3>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
            {hasFilter ? 'Try adjusting your search or filters.' : 'All caught up! No tickets require attention right now.'}
          </p>
          {hasFilter && (
            <button
              onClick={clearFilters}
              style={{ marginTop: '1rem', padding: '8px 20px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', fontWeight: 500 }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Desktop table ───────────────────────────────────────────── */}
          <div id="queue-table-desktop" style={{ ...card, overflowX: 'auto', marginBottom: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#EAF6EF' }}>
                <tr>
                  <th style={{ ...th, cursor: 'pointer' }} onClick={() => sortToggle('ticketNumber')}>Ticket #{sortIcon('ticketNumber')}</th>
                  <th style={{ ...th, cursor: 'pointer' }} onClick={() => sortToggle('createdAt')}>Created{sortIcon('createdAt')}</th>
                  <th style={th}>Summary</th>
                  <th style={th}>Category</th>
                  <th style={{ ...th, textAlign: 'center' }}>Req. Priority</th>
                  <th style={{ ...th, cursor: 'pointer', textAlign: 'center' }} onClick={() => sortToggle('itPriority')}>IT Priority{sortIcon('itPriority')}</th>
                  <th style={{ ...th, cursor: 'pointer', textAlign: 'center' }} onClick={() => sortToggle('status')}>Status{sortIcon('status')}</th>
                  <th style={{ ...th, cursor: 'pointer' }} onClick={() => sortToggle('ownerId')}>Owner{sortIcon('ownerId')}</th>
                  <th style={{ ...th, cursor: 'pointer' }} onClick={() => sortToggle('updatedAt')}>Last Updated{sortIcon('updatedAt')}</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t, idx) => (
                  <tr
                    key={t.id}
                    style={{ background: idx % 2 === 0 ? '#fff' : '#FAFAFA', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F0FDF4')}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#FAFAFA')}
                  >
                    <td style={{ ...td, color: '#006B3C', fontWeight: 700 }}>{t.ticketNumber}</td>
                    <td style={td}>{fmtDate(t.createdAt)}</td>
                    <td style={{ ...td, maxWidth: '240px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.summary}</span>
                    </td>
                    <td style={td}>{t.category?.name ?? '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}><PBadge v={t.requestedPriority} /></td>
                    <td style={{ ...td, textAlign: 'center' }}><PBadge v={t.itPriority} /></td>
                    <td style={{ ...td, textAlign: 'center' }}><SBadge v={t.status} /></td>
                    <td style={td}>
                      {t.owner?.name ?? (
                        <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={td}>{fmtDate(t.updatedAt)}</td>
                    <td style={td}>
                      <button
                        id={`btn-open-ticket-${t.id}`}
                        onClick={() => navigate(`/staff/tickets/${t.id}`)}
                        style={{
                          padding: '5px 14px', borderRadius: '6px',
                          border: '1px solid #006B3C', background: '#F0FDF4',
                          color: '#006B3C', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem',
                        }}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile card stack ───────────────────────────────────────── */}
          <div id="queue-list-mobile">
            {tickets.map(t => (
              <div
                key={t.id}
                onClick={() => navigate(`/staff/tickets/${t.id}`)}
                style={{ ...card, padding: '1rem', marginBottom: '0.75rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ color: '#006B3C', fontWeight: 700, fontSize: '0.9rem' }}>{t.ticketNumber}</span>
                  <SBadge v={t.status} />
                </div>
                <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '8px', fontWeight: 500 }}>{t.summary}</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <PBadge v={t.itPriority} />
                  <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                    {t.owner?.name ?? 'Unassigned'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ──────────────────────────────────────────────── */}
          {pagination && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.84rem', color: '#6B7280' }}>
                {pagination.totalCount === 0
                  ? 'No tickets'
                  : `Showing ${(pagination.currentPage - 1) * pagination.pageSize + 1}–${Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of ${pagination.totalCount} tickets`
                }
              </span>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '0.84rem', marginRight: '8px' }}
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#9CA3AF' : '#374151', fontSize: '0.84rem' }}
                >
                  ‹ Prev
                </button>
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        padding: '5px 10px', borderRadius: '6px', fontSize: '0.84rem',
                        border: p === page ? 'none' : '1px solid #E5E7EB',
                        background: p === page ? '#006B3C' : '#fff',
                        color: p === page ? '#fff' : '#374151',
                        cursor: 'pointer', fontWeight: p === page ? 700 : 400,
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages || pagination.totalPages === 0}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff', cursor: (page === pagination.totalPages || pagination.totalPages === 0) ? 'not-allowed' : 'pointer', color: (page === pagination.totalPages || pagination.totalPages === 0) ? '#9CA3AF' : '#374151', fontSize: '0.84rem' }}
                >
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

export default StaffTicketQueue;
