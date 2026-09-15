import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AttachmentSection from './AttachmentSection';

// ── Types ────────────────────────────────────────────────────────────────────

interface TicketDetail {
  id: number;
  ticketNumber: string;
  status: string;
  requestedPriority: string;
  itPriority?: string;
  summary: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  requesterIndicatedResolved?: boolean;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string };
  requester: { id: number; name: string; email: string };
  owner?: { id: number; name: string } | null;
}

interface Comment {
  id: number;
  ticketId: number;
  authorId: number;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
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
  NEW:                   { label: 'New',                  bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  OPEN:                  { label: 'Open',                 bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  IN_PROGRESS:           { label: 'In Progress',          bg: '#F5F3FF', color: '#5B21B6', border: '#C4B5FD' },
  WAITING_FOR_REQUESTER: { label: 'Waiting',              bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  RESOLVED:              { label: 'Resolved',             bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
  CLOSED:                { label: 'Closed',               bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' },
  REOPENED:              { label: 'Reopened',             bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  CANCELLED:             { label: 'Cancelled',            bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB' },
};

const BadgeEl: React.FC<{ value: string; map: typeof PRIORITY_MAP }> = ({ value, map }) => {
  const s = map[value] ?? { label: value, bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' };
  return (
    <span style={{
      display: 'inline-block', fontSize: '0.78rem', fontWeight: 600,
      padding: '3px 12px', borderRadius: '9999px',
      backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>{s.label}</span>
  );
};

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
  const { user } = useAuth();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [postingComment, setPostingComment] = useState(false);

  // "Problem Appears Resolved"
  const [resolvedLoading, setResolvedLoading] = useState(false);
  const [resolvedConfirm, setResolvedConfirm] = useState(false);

  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  const fetchTicket = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${id}`, { credentials: 'include' });
      if (res.status === 404) { setError('Ticket not found.'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTicket(data);
    } catch {
      setError('Unable to load ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/tickets/${id}/comments`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } catch { /**/ } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
    fetchComments();
  }, [fetchTicket, fetchComments]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!commentText.trim()) { setCommentError('Comment cannot be empty.'); return; }
    if (commentText.trim().length > 2000) { setCommentError('Comment must be 2000 characters or less.'); return; }

    setPostingComment(true);
    try {
      const res = await fetch(`/api/tickets/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setCommentError(data.error?.message ?? 'Failed to post comment.');
        return;
      }
      setCommentText('');
      fetchComments();
    } catch {
      setCommentError('Unable to post comment. Please try again.');
    } finally {
      setPostingComment(false);
    }
  };

  const handleRequesterResolved = async () => {
    if (!ticket) return;
    setResolvedLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/requester-resolved`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (res.ok) {
        setTicket(t => t ? { ...t, requesterIndicatedResolved: true } : t);
      }
    } catch { /**/ } finally {
      setResolvedLoading(false);
      setResolvedConfirm(false);
    }
  };

  const canMarkResolved = ticket &&
    (ticket.status === 'IN_PROGRESS' || ticket.status === 'WAITING_FOR_REQUESTER') &&
    !ticket.requesterIndicatedResolved;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div id="ticket-detail-page" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
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

      {/* General error */}
      {!loading && error && (
        <div id="ticket-detail-error" style={{ ...card, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          {error}
        </div>
      )}

      {/* Ticket detail */}
      {!loading && !error && ticket && (
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
              <BadgeEl value={ticket.requestedPriority} map={PRIORITY_MAP} />
              <BadgeEl value={ticket.status} map={STATUS_MAP} />
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
            <FieldRow label="Status"><BadgeEl value={ticket.status} map={STATUS_MAP} /></FieldRow>
            <FieldRow label="Requested Priority"><BadgeEl value={ticket.requestedPriority} map={PRIORITY_MAP} /></FieldRow>
            {ticket.itPriority && <FieldRow label="IT Priority"><BadgeEl value={ticket.itPriority} map={PRIORITY_MAP} /></FieldRow>}
            <FieldRow label="Category">{ticket.category?.name ?? '—'}</FieldRow>
            <FieldRow label="Related System">{ticket.relatedSystem?.name ?? '—'}</FieldRow>
            <FieldRow label="Submitted By">{ticket.requester?.name ?? '—'}</FieldRow>
            <FieldRow label="Owner">{ticket.owner?.name ?? 'Unassigned'}</FieldRow>
            <FieldRow label="Created">{fmtDate(ticket.createdAt)}</FieldRow>
            <FieldRow label="Last Updated">{fmtDate(ticket.updatedAt)}</FieldRow>
          </div>

          {/* "Problem Appears Resolved" — only for Requester (FR-12) */}
          {user?.role === 'REQUESTER' && (
            <div style={card}>
              {ticket.requesterIndicatedResolved ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#065F46', background: '#ECFDF5', borderRadius: '8px', padding: '12px 16px' }}>
                  ✅ <span style={{ fontWeight: 600 }}>Marked as Appears Resolved</span>
                  <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>— IT Staff will formally resolve the ticket</span>
                </div>
              ) : canMarkResolved ? (
                <>
                  {resolvedConfirm ? (
                    <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '1rem' }}>
                      <p style={{ margin: '0 0 0.75rem', fontWeight: 600, color: '#92400E' }}>
                        Are you sure? This indicates to IT Staff that the issue appears resolved.
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          id="btn-confirm-resolved"
                          onClick={handleRequesterResolved}
                          disabled={resolvedLoading}
                          style={{
                            padding: '8px 18px', borderRadius: '8px', border: 'none',
                            background: '#006B3C', color: '#fff', fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          {resolvedLoading ? 'Submitting…' : 'Yes, mark as appears resolved'}
                        </button>
                        <button
                          onClick={() => setResolvedConfirm(false)}
                          style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      id="btn-problem-appears-resolved"
                      onClick={() => setResolvedConfirm(true)}
                      style={{
                        padding: '9px 20px', borderRadius: '8px',
                        border: '1px solid #6EE7B7', background: '#F0FDF4',
                        color: '#065F46', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                      }}
                    >
                      ✓ Problem Appears Resolved
                    </button>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* Attachments */}
          <AttachmentSection ticketId={ticket.id} />

          {/* Public Comments (FR-11, FR-18) */}
          <div style={card} id="comments-section">
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#006B3C', marginBottom: '1rem' }}>
              Public Comments
            </h2>

            {commentsLoading ? (
              <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Loading comments…</p>
            ) : comments.length === 0 ? (
              <p id="comments-empty-state" style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
                No comments yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.25rem' }}>
                {comments.map(c => (
                  <div key={c.id} style={{
                    background: '#F9FAFB', borderRadius: '8px',
                    borderLeft: '3px solid #006B3C', padding: '12px 16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151' }}>{c.authorName}</span>
                      <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{fmtDate(c.createdAt)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', whiteSpace: 'pre-wrap' }}>{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Post Comment form */}
            <form onSubmit={handlePostComment} style={{ marginTop: '1rem' }}>
              <textarea
                id="comment-input"
                value={commentText}
                onChange={e => { setCommentText(e.target.value); setCommentError(null); }}
                placeholder="Write a comment…"
                rows={3}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: `1px solid ${commentError ? '#EF4444' : '#E5E7EB'}`,
                  fontSize: '0.875rem', resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
              {commentError && <p style={{ color: '#DC2626', fontSize: '0.8rem', margin: '4px 0 0' }}>{commentError}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{commentText.length}/2000</span>
                <button
                  id="btn-post-comment"
                  type="submit"
                  disabled={postingComment}
                  style={{
                    padding: '8px 20px', borderRadius: '8px', border: 'none',
                    background: '#006B3C', color: '#fff', fontWeight: 600,
                    cursor: postingComment ? 'not-allowed' : 'pointer', fontSize: '0.875rem',
                    opacity: postingComment ? 0.7 : 1,
                  }}
                >
                  {postingComment ? 'Posting…' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default TicketDetailPage;
