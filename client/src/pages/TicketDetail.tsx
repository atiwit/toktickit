import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRequester } from '../context/RequesterContext';
import AttachmentSection from './AttachmentSection';

// ── Types ────────────────────────────────────────────────────────────────────

interface TicketDetail {
  id: number;
  ticketNumber: string;
  status: string;
  requestedPriority: string;
  summary: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string };
  requester: { id: number; name: string; email: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const PRIORITY_MAP: Record<string, { label: string; bg: string; color: string; border: string }> = {
  LOW:      { label: 'Low',      bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
  MEDIUM:   { label: 'Medium',   bg: '#FFFBEB', color: '#92400E', border: '#FCD34D' },
  HIGH:     { label: 'High',     bg: '#FFF1F2', color: '#9F1239', border: '#FECDD3' },
  CRITICAL: { label: 'Critical', bg: '#FFF1F2', color: '#9F1239', border: '#FECDD3' },
};

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; border: string }> = {
  NEW:         { label: 'New',         bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  OPEN:        { label: 'Open',        bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  IN_PROGRESS: { label: 'In Progress', bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
  RESOLVED:    { label: 'Resolved',    bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
  CLOSED:      { label: 'Closed',      bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' },
  PENDING:     { label: 'Pending',     bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
};

const Badge: React.FC<{ value: string; map: typeof PRIORITY_MAP }> = ({ value, map }) => {
  const s = map[value] ?? { label: value, bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' };
  return (
    <span style={{
      display: 'inline-block', fontSize: '0.78rem', fontWeight: 600,
      padding: '3px 12px', borderRadius: '9999px',
      backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>{s.label}</span>
  );
};

// ── Styled row helper ─────────────────────────────────────────────────────────

const FieldRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0.5rem', padding: '10px 0', borderBottom: '1px solid #F3F4F6', alignItems: 'flex-start' }}>
    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: '2px' }}>{label}</span>
    <span style={{ fontSize: '0.88rem', color: '#111827' }}>{children}</span>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedRequester } = useRequester();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!selectedRequester || !id) return;

    const fetchTicket = async () => {
      setLoading(true);
      setError(null);
      setForbidden(false);
      try {
        const res = await fetch(`/api/tickets/${id}`, {
          headers: { 'X-Requester-Id': String(selectedRequester.id) },
        });
        if (res.status === 403) {
          setForbidden(true);
          return;
        }
        if (res.status === 404) {
          setError('Ticket not found.');
          return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTicket(data);
      } catch {
        setError('Unable to load ticket. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [selectedRequester, id]);

  // ── styles ────────────────────────────────────────────────────────────────
  const pageWrap: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, sans-serif",
    backgroundColor: '#F5F7F6',
    minHeight: '100vh',
    padding: '2rem',
  };
  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div id="ticket-detail-page" style={pageWrap}>
      {/* Back nav */}
      <button
        id="btn-back-to-tickets"
        onClick={() => navigate('/')}
        style={{
          background: 'none', border: 'none', color: '#006B3C', fontWeight: 600,
          fontSize: '0.88rem', cursor: 'pointer', padding: 0, marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}
      >
        ← Back to My Tickets
      </button>

      {/* Loading */}
      {loading && (
        <div id="ticket-detail-loading" style={{ ...card, textAlign: 'center', padding: '4rem' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #E5E7EB', borderTopColor: '#006B3C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Forbidden (AC-03) */}
      {!loading && forbidden && (
        <div
          id="ticket-detail-forbidden"
          style={{ ...card, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', textAlign: 'center', padding: '3rem' }}
        >
          <p style={{ fontSize: '1.5rem', margin: 0 }}>🔒</p>
          <h2 style={{ fontWeight: 700, marginTop: '0.5rem' }}>Access Denied</h2>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            You do not have permission to view this ticket.
          </p>
        </div>
      )}

      {/* General error */}
      {!loading && !forbidden && error && (
        <div
          id="ticket-detail-error"
          style={{ ...card, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
        >
          {error}
        </div>
      )}

      {/* Ticket detail */}
      {!loading && !forbidden && !error && ticket && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h1 id="ticket-detail-number" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#006B3C', margin: 0 }}>
                {ticket.ticketNumber}
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: '4px 0 0' }}>
                Created {fmtDate(ticket.createdAt)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Badge value={ticket.requestedPriority} map={PRIORITY_MAP} />
              <Badge value={ticket.status} map={STATUS_MAP} />
            </div>
          </div>

          {/* Summary & Description */}
          <div style={card}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
              {ticket.summary}
            </h2>
            <p id="ticket-detail-description" style={{ fontSize: '0.88rem', color: '#374151', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {ticket.description}
            </p>
          </div>

          {/* Fields grid */}
          <div style={card}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#006B3C', marginBottom: '0.5rem' }}>Ticket Information</h2>
            <FieldRow label="Ticket No.">{ticket.ticketNumber}</FieldRow>
            <FieldRow label="Status"><Badge value={ticket.status} map={STATUS_MAP} /></FieldRow>
            <FieldRow label="Requested Priority"><Badge value={ticket.requestedPriority} map={PRIORITY_MAP} /></FieldRow>
            <FieldRow label="Category">{ticket.category?.name ?? '—'}</FieldRow>
            <FieldRow label="Related System">{ticket.relatedSystem?.name ?? '—'}</FieldRow>
            <FieldRow label="Submitted By">{ticket.requester?.name ?? '—'}</FieldRow>
            <FieldRow label="Created">{fmtDate(ticket.createdAt)}</FieldRow>
            <FieldRow label="Last Updated">{fmtDate(ticket.updatedAt)}</FieldRow>
          </div>

          {/* Attachments */}
          <AttachmentSection ticketId={ticket.id} />
        </>
      )}
    </div>
  );
};

export default TicketDetailPage;
