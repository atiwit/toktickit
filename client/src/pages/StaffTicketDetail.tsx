import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface StaffTicketDetail {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  status: string;
  requestedPriority: string;
  itPriority: string;
  requesterIndicatedResolved: boolean;
  createdAt: string;
  updatedAt: string;
  permittedStatuses: string[];
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string };
  requester: { id: number; name: string };
  owner: { id: number; name: string } | null;
  attachments: Attachment[];
}

interface Attachment {
  id: number; ticketId: number; originalFilename: string;
  mimeType: string; size: number; isRemoved: boolean;
  removedReason: string | null; removedAt: string | null; uploadedAt: string;
}

interface Comment {
  id: number; authorId: number; authorName: string; authorRole: string;
  content: string; createdAt: string;
}

interface Note {
  id: number; authorId: number; authorName: string;
  content: string; createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const fmtBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const PRIORITY_S: Record<string, { bg: string; color: string; label: string }> = {
  LOW:      { bg: '#ECFDF5', color: '#065F46', label: 'Low' },
  MEDIUM:   { bg: '#FFFBEB', color: '#92400E', label: 'Medium' },
  HIGH:     { bg: '#FFF1F2', color: '#9F1239', label: 'High' },
  CRITICAL: { bg: '#FEF2F2', color: '#7F1D1D', label: 'Critical' },
};

const STATUS_S: Record<string, { bg: string; color: string; label: string }> = {
  NEW:                   { bg: '#EFF6FF', color: '#1D4ED8', label: 'New' },
  OPEN:                  { bg: '#FEF3C7', color: '#92400E', label: 'Open' },
  IN_PROGRESS:           { bg: '#F5F3FF', color: '#5B21B6', label: 'In Progress' },
  WAITING_FOR_REQUESTER: { bg: '#FFF7ED', color: '#C2410C', label: 'Waiting for Requester' },
  RESOLVED:              { bg: '#ECFDF5', color: '#065F46', label: 'Resolved' },
  CLOSED:                { bg: '#F3F4F6', color: '#374151', label: 'Closed' },
  REOPENED:              { bg: '#FEF2F2', color: '#991B1B', label: 'Reopened' },
  CANCELLED:             { bg: '#F9FAFB', color: '#6B7280', label: 'Cancelled' },
};

const PBadge: React.FC<{ v: string }> = ({ v }) => {
  const s = PRIORITY_S[v] ?? { bg: '#F3F4F6', color: '#374151', label: v };
  return <span style={{ display: 'inline-block', fontSize: '0.78rem', fontWeight: 700, padding: '3px 12px', borderRadius: '9999px', backgroundColor: s.bg, color: s.color }}>{s.label}</span>;
};
const SBadge: React.FC<{ v: string }> = ({ v }) => {
  const s = STATUS_S[v] ?? { bg: '#F3F4F6', color: '#374151', label: v };
  return <span style={{ display: 'inline-block', fontSize: '0.78rem', fontWeight: 700, padding: '3px 12px', borderRadius: '9999px', backgroundColor: s.bg, color: s.color }}>{s.label}</span>;
};

// ── Component ─────────────────────────────────────────────────────────────────

const StaffTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<StaffTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [postingNote, setPostingNote] = useState(false);

  // IT Staff operation feedback
  const [opStatus, setOpStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Confirmation dialog for destructive transitions (Cancel, Close)
  const [confirmTransition, setConfirmTransition] = useState<string | null>(null);

  const card: React.CSSProperties = {
    background: '#fff', borderRadius: '10px', border: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)', padding: '1.5rem', marginBottom: '1.5rem',
  };

  const fetchTicket = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/tickets/${id}`, { credentials: 'include' });
      if (res.status === 404) { setError('Ticket not found.'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTicket(data.ticket ?? data);
    } catch { setError('Unable to load ticket.'); } finally { setLoading(false); }
  }, [id]);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/tickets/${id}/comments`, { credentials: 'include' });
    if (res.ok) { const d = await res.json(); setComments(d.comments ?? []); }
  }, [id]);

  const fetchNotes = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/staff/tickets/${id}/notes`, { credentials: 'include' });
    if (res.ok) { const d = await res.json(); setNotes(d.notes ?? []); }
  }, [id]);

  useEffect(() => { fetchTicket(); fetchComments(); fetchNotes(); }, [fetchTicket, fetchComments, fetchNotes]);

  // ── IT Staff Operations ───────────────────────────────────────────────────

  const showOp = (type: 'success' | 'error', msg: string) => {
    setOpStatus({ type, msg });
    setTimeout(() => setOpStatus(null), 4000);
  };

  const claimSelf = async () => {
    const res = await fetch(`/api/staff/tickets/${id}/owner`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ ownerId: 'self' }),
    });
    if (res.ok) { fetchTicket(); showOp('success', 'You are now the owner of this ticket.'); }
    else showOp('error', 'Failed to assign ownership.');
  };

  const changeStatus = async (newStatus: string) => {
    const res = await fetch(`/api/staff/tickets/${id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) { fetchTicket(); showOp('success', `Status updated to "${STATUS_S[newStatus]?.label ?? newStatus}"`); }
    else {
      const d = await res.json();
      showOp('error', d.error?.message ?? 'Failed to update status.');
    }
  };

  const changePriority = async (itPriority: string) => {
    const res = await fetch(`/api/staff/tickets/${id}/priority`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ itPriority }),
    });
    if (res.ok) { fetchTicket(); showOp('success', 'IT Priority updated.'); }
    else showOp('error', 'Failed to update priority.');
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPostingComment(true);
    const res = await fetch(`/api/tickets/${id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ content: newComment.trim() }),
    });
    if (res.ok) { setNewComment(''); fetchComments(); }
    setPostingComment(false);
  };

  const postNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setPostingNote(true);
    const res = await fetch(`/api/staff/tickets/${id}/notes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ content: newNote.trim() }),
    });
    if (res.ok) { setNewNote(''); fetchNotes(); }
    setPostingNote(false);
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #E5E7EB', borderTopColor: '#006B3C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '1.5rem', color: '#B91C1C' }}>
      {error}
    </div>
  );

  if (!ticket) return null;

  return (
    <div id="staff-ticket-detail" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Back */}
      <button id="btn-back-to-queue" onClick={() => navigate('/staff/tickets')} style={{
        background: 'none', border: 'none', color: '#006B3C', fontWeight: 600,
        fontSize: '0.88rem', cursor: 'pointer', padding: 0, marginBottom: '1rem',
        display: 'flex', alignItems: 'center', gap: '4px',
      }}>
        ← Back to Queue
      </button>

      {/* Op status */}
      {opStatus && (
        <div style={{
          padding: '10px 16px', borderRadius: '8px', marginBottom: '1rem', fontWeight: 600, fontSize: '0.875rem',
          background: opStatus.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${opStatus.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
          color: opStatus.type === 'success' ? '#065F46' : '#B91C1C',
        }}>
          {opStatus.type === 'success' ? '✓ ' : '✗ '}{opStatus.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 id="staff-ticket-number" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#006B3C', margin: 0 }}>{ticket.ticketNumber}</h1>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: '4px 0 0' }}>Created {fmtDate(ticket.createdAt)}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <PBadge v={ticket.requestedPriority} />
          <PBadge v={ticket.itPriority} />
          <SBadge v={ticket.status} />
        </div>
      </div>

      {/* 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }} className="staff-detail-grid">

        {/* ── Left column ── */}
        <div>
          {/* Summary & Description */}
          <div style={card}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>{ticket.summary}</h2>
            <p style={{ fontSize: '0.88rem', color: '#374151', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{ticket.description}</p>
          </div>

          {/* Ticket info */}
          <div style={card}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#006B3C', marginBottom: '0.75rem' }}>Ticket Information</h3>
            {[
              ['Requester', ticket.requester?.name],
              ['Category', ticket.category?.name],
              ['Related System', ticket.relatedSystem?.name],
              ['Owner', ticket.owner?.name ?? 'Unassigned'],
              ['Req. Priority', <PBadge key="rp" v={ticket.requestedPriority} />],
              ['IT Priority', <PBadge key="ip" v={ticket.itPriority} />],
              ['Status', <SBadge key="s" v={ticket.status} />],
              ['Last Updated', fmtDate(ticket.updatedAt)],
            ].map(([label, value]) => (
              <div key={String(label)} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.5rem', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                <span style={{ fontSize: '0.875rem', color: '#111827' }}>{value}</span>
              </div>
            ))}
            {ticket.requesterIndicatedResolved && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center', background: '#F0FDF4', borderRadius: '6px', padding: '8px 12px' }}>
                <span>✅</span>
                <span style={{ fontSize: '0.85rem', color: '#065F46', fontWeight: 600 }}>Requester indicated: problem appears resolved</span>
              </div>
            )}
          </div>

          {/* Attachments */}
          <div style={card}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#006B3C', marginBottom: '0.75rem' }}>Attachments ({ticket.attachments.filter(a => !a.isRemoved).length})</h3>
            {ticket.attachments.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>No attachments.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ticket.attachments.map(a => (
                  <div key={a.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', borderRadius: '6px',
                    background: a.isRemoved ? '#F9FAFB' : '#F0FDF4',
                    border: `1px solid ${a.isRemoved ? '#E5E7EB' : '#BBF7D0'}`,
                    opacity: a.isRemoved ? 0.6 : 1,
                  }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', textDecoration: a.isRemoved ? 'line-through' : 'none' }}>
                        {a.originalFilename}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#6B7280', marginLeft: '8px' }}>{fmtBytes(a.size)}</span>
                      {a.isRemoved && <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginLeft: '8px' }}>[Removed]</span>}
                    </div>
                    {!a.isRemoved && (
                      <a
                        href={`/api/attachments/${a.id}/download`}
                        download={a.originalFilename}
                        style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #6EE7B7', background: '#fff', color: '#065F46', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}
                        onClick={e => e.stopPropagation()}
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Public Comments */}
          <div style={card}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#006B3C', marginBottom: '0.75rem' }}>Public Comments</h3>
            {comments.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>No comments yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1rem' }}>
                {comments.map(c => (
                  <div key={c.id} style={{ background: '#F9FAFB', borderLeft: '3px solid #006B3C', borderRadius: '6px', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#374151' }}>{c.authorName} ({c.authorRole === 'REQUESTER' ? 'Requester' : 'IT Staff'})</span>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{fmtDate(c.createdAt)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151' }}>{c.content}</p>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={postComment}>
              <textarea id="comment-input-staff" value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Write a public comment visible to the requester…"
                rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="submit" id="btn-post-comment-staff" disabled={postingComment || !newComment.trim()}
                  style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: '#006B3C', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', opacity: postingComment ? 0.7 : 1 }}>
                  {postingComment ? 'Posting…' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>

          {/* Internal Notes — IT Staff only */}
          <div style={{ ...card, borderColor: '#FCD34D' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400E', marginBottom: '0.75rem' }}>
              🔒 Internal Notes (IT Staff only)
            </h3>
            {notes.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>No internal notes.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1rem' }}>
                {notes.map(n => (
                  <div key={n.id} style={{ background: '#FFFBEB', borderLeft: '3px solid #FCD34D', borderRadius: '6px', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#374151' }}>{n.authorName}</span>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{fmtDate(n.createdAt)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151' }}>{n.content}</p>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={postNote}>
              <textarea id="note-input-staff" value={newNote} onChange={e => setNewNote(e.target.value)}
                placeholder="Add an internal note (visible to IT Staff only)…"
                rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #FCD34D', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="submit" id="btn-post-note-staff" disabled={postingNote || !newNote.trim()}
                  style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: '#92400E', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', opacity: postingNote ? 0.7 : 1 }}>
                  {postingNote ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Right column: IT Staff Operations ── */}
        <div>
          {/* Claim / Owner */}
          <div style={{ ...card, backgroundColor: '#FAFAFA' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151', marginBottom: '1rem' }}>Ticket Owner</h3>
            <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>
              <strong>Current:</strong> {ticket.owner?.name ?? <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Unassigned</span>}
            </div>
            {(!ticket.owner || ticket.owner.id !== user?.id) && (
              <button
                id="btn-claim-ticket"
                onClick={claimSelf}
                style={{
                  width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #6EE7B7',
                  background: '#F0FDF4', color: '#065F46', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                {ticket.owner ? '↺ Reassign to Me' : '✋ Claim This Ticket'}
              </button>
            )}
            {ticket.owner?.id === user?.id && (
              <div style={{ fontSize: '0.8rem', color: '#065F46', background: '#F0FDF4', padding: '8px 12px', borderRadius: '6px' }}>
                ✓ You are the current owner
              </div>
            )}
          </div>

          {/* IT Priority */}
          <div style={{ ...card, backgroundColor: '#FAFAFA' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151', marginBottom: '1rem' }}>IT Priority</h3>
            <select
              id="select-it-priority"
              value={ticket.itPriority}
              onChange={e => changePriority(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.875rem' }}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Status Change */}
          <div style={{ ...card, backgroundColor: '#FAFAFA' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Update Status</h3>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '0 0 0.75rem' }}>
              Current: <SBadge v={ticket.status} />
            </p>
            {ticket.permittedStatuses.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF', fontStyle: 'italic' }}>No status transitions available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ticket.permittedStatuses.map(s => {
                  const st = STATUS_S[s] ?? { bg: '#F3F4F6', color: '#374151', label: s };
                  return (
                    <button
                      key={s}
                      id={`btn-status-${s.toLowerCase()}`}
                      onClick={() =>
                        (s === 'CANCELLED' || s === 'CLOSED')
                          ? setConfirmTransition(s)
                          : changeStatus(s)
                      }
                      style={{
                        padding: '8px 12px', borderRadius: '8px', border: `1px solid ${st.color}`,
                        background: st.bg, color: st.color, fontWeight: 600,
                        cursor: 'pointer', fontSize: '0.84rem', textAlign: 'left',
                      }}
                    >
                      → {st.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirmation Dialog for destructive transitions ── */}
      {confirmTransition && (
        <div
          id="confirm-transition-overlay"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.45)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setConfirmTransition(null)}
        >
          <div
            id="confirm-transition-dialog"
            style={{
              background: '#fff', borderRadius: '12px', padding: '1.75rem',
              maxWidth: '420px', width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>
              Confirm: {STATUS_S[confirmTransition]?.label ?? confirmTransition}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              {confirmTransition === 'CANCELLED'
                ? 'Are you sure you want to cancel this ticket? Cancelled tickets cannot be re-opened through normal transitions.'
                : 'Are you sure you want to close this ticket? Closed tickets can be reopened, but this is a significant status change.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                id="btn-confirm-dialog-dismiss"
                onClick={() => setConfirmTransition(null)}
                style={{
                  padding: '8px 18px', borderRadius: '8px', border: '1px solid #D1D5DB',
                  background: '#fff', color: '#374151', fontWeight: 600,
                  cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                Keep Ticket
              </button>
              <button
                id="btn-confirm-dialog-proceed"
                onClick={() => { changeStatus(confirmTransition); setConfirmTransition(null); }}
                style={{
                  padding: '8px 18px', borderRadius: '8px', border: 'none',
                  background: '#DC2626', color: '#fff', fontWeight: 600,
                  cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                Yes, {confirmTransition === 'CANCELLED' ? 'Cancel Ticket' : 'Close Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .staff-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default StaffTicketDetail;
