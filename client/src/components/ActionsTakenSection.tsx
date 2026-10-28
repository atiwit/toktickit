import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export interface ActionTaken {
  id: number;
  ticketId: number;
  actionDateTime: string;
  actionDescription: string;
  result: string;
  performedById: number;
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
  createdAt: string;
  updatedAt: string;
  performedBy?: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface ActionsTakenSectionProps {
  ticketId: number;
  actions: ActionTaken[];
  readOnly?: boolean;
  onActionSaved?: () => void;
  isOpenModalDirectly?: boolean;
  onCloseDirectModal?: () => void;
}

const fmtDate = (iso: string) => {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const toDateTimeLocal = (dateOrIso?: string | Date) => {
  const d = dateOrIso ? new Date(dateOrIso) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const ActionsTakenSection: React.FC<ActionsTakenSectionProps> = ({
  ticketId,
  actions,
  readOnly = false,
  onActionSaved,
  isOpenModalDirectly = false,
  onCloseDirectModal,
}) => {
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionTaken | null>(null);

  // Form states
  const [actionDateTime, setActionDateTime] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [result, setResult] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [attachmentNotes, setAttachmentNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync external direct modal trigger
  useEffect(() => {
    if (isOpenModalDirectly) {
      openAddModal();
    }
  }, [isOpenModalDirectly]);

  // Handle Escape key to close modal & lock body scroll
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  const openAddModal = () => {
    setEditingAction(null);
    setActionDateTime(toDateTimeLocal());
    setActionDescription('');
    setResult('');
    setFollowUpRequired(false);
    setFollowUpNote('');
    setAttachmentNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (action: ActionTaken) => {
    setEditingAction(action);
    setActionDateTime(toDateTimeLocal(action.actionDateTime));
    setActionDescription(action.actionDescription);
    setResult(action.result);
    setFollowUpRequired(action.followUpRequired);
    setFollowUpNote(action.followUpNote ?? '');
    setAttachmentNotes(action.attachmentNotes ?? '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAction(null);
    setFormError(null);
    if (onCloseDirectModal) {
      onCloseDirectModal();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!actionDateTime || isNaN(new Date(actionDateTime).getTime())) {
      setFormError('Action date and time is required and must be valid');
      return;
    }

    if (!actionDescription.trim()) {
      setFormError('Action description is required');
      return;
    }
    if (actionDescription.trim().length > 2000) {
      setFormError('Action description must be 2000 characters or less');
      return;
    }

    if (!result.trim()) {
      setFormError('Action result is required');
      return;
    }
    if (result.trim().length > 2000) {
      setFormError('Action result must be 2000 characters or less');
      return;
    }

    if (followUpRequired) {
      if (!followUpNote.trim()) {
        setFormError('Follow-up note is required when follow-up is requested');
        return;
      }
      if (followUpNote.trim().length > 2000) {
        setFormError('Follow-up note must be 2000 characters or less');
        return;
      }
    }

    if (attachmentNotes.trim().length > 1000) {
      setFormError('Attachment notes must be 1000 characters or less');
      return;
    }

    const payload = {
      actionDateTime: new Date(actionDateTime).toISOString(),
      actionDescription: actionDescription.trim(),
      result: result.trim(),
      followUpRequired,
      followUpNote: followUpRequired ? followUpNote.trim() : null,
      attachmentNotes: attachmentNotes.trim() ? attachmentNotes.trim() : null,
    };

    setIsSaving(true);
    try {
      const url = editingAction
        ? `/api/tickets/${ticketId}/actions-taken/${editingAction.id}`
        : `/api/tickets/${ticketId}/actions-taken`;
      const method = editingAction ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setFormError(errorData.error?.message ?? errorData.message ?? 'Failed to save action taken');
        return;
      }

      closeModal();
      if (onActionSaved) {
        onActionSaved();
      }
    } catch {
      setFormError('An unexpected network error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  return (
    <div id="actions-taken-section" style={cardStyle}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#006B3C',
              margin: 0,
            }}
          >
            Actions Taken
          </h2>
          <span
            id="actions-taken-count"
            style={{
              display: 'inline-block',
              background: '#EAF6EF',
              color: '#006B3C',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            {actions.length}
          </span>
        </div>

        {!readOnly && (
          <button
            id="btn-add-action-taken"
            type="button"
            aria-label="Add Action Taken"
            onClick={openAddModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: '#006B3C',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              transition: 'background-color 0.15s',
            }}
          >
            <span>+</span>
            <span>Add Action Taken</span>
          </button>
        )}
      </div>

      {/* List or Empty State */}
      {actions.length === 0 ? (
        <div
          id="actions-empty-state"
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            background: '#F9FAFB',
            borderRadius: '8px',
            border: '1px dashed #D1D5DB',
            color: '#6B7280',
            fontSize: '0.875rem',
            fontStyle: 'italic',
          }}
        >
          No actions taken recorded yet.
        </div>
      ) : (
        <div
          id="actions-list"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {actions.map((action) => (
            <div
              key={action.id}
              id={`action-item-${action.id}`}
              style={{
                background: '#FAFAFA',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                borderLeft: '4px solid #006B3C',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Row 1: Header with Date, PerformedBy and Edit Button */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#374151',
                    }}
                  >
                    {fmtDate(action.actionDateTime)}
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      background: '#EAF6EF',
                      color: '#065F46',
                      border: '1px solid #BBF7D0',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    👤 {action.performedBy?.name ?? 'IT Staff'}
                  </span>
                  {action.followUpRequired && (
                    <span
                      style={{
                        display: 'inline-block',
                        background: '#FFFBEB',
                        color: '#92400E',
                        border: '1px solid #FCD34D',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      ⚠️ Follow-up Required
                    </span>
                  )}
                </div>

                {!readOnly && (
                  <button
                    id={`btn-edit-action-${action.id}`}
                    type="button"
                    aria-label={`Edit action ${action.id}`}
                    onClick={() => openEditModal(action)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      background: '#ffffff',
                      color: '#374151',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {/* Row 2: Description */}
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  Action Description:
                </span>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#1F2937',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                  }}
                >
                  {action.actionDescription}
                </p>
              </div>

              {/* Row 3: Result */}
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#065F46',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  Result:
                </span>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#111827',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                  }}
                >
                  {action.result}
                </p>
              </div>

              {/* Row 4: Follow-up Note if any */}
              {action.followUpRequired && action.followUpNote && (
                <div
                  style={{
                    background: '#FFFDF5',
                    border: '1px solid #FEF3C7',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    color: '#92400E',
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: '2px' }}>Follow-up Note:</strong>
                  {action.followUpNote}
                </div>
              )}

              {/* Row 5: Attachment Notes if any */}
              {action.attachmentNotes && (
                <div style={{ fontSize: '0.78rem', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>📎 Attachment Notes:</span>
                  <span style={{ fontStyle: 'italic' }}>{action.attachmentNotes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modal for Add / Edit Action Taken ── */}
      {isModalOpen && (
        <div
          id="action-taken-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={closeModal}
        >
          <div
            id="action-taken-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-action-title"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Title */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                borderBottom: '1px solid #E5E7EB',
                paddingBottom: '0.75rem',
              }}
            >
              <h3
                id="modal-action-title"
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#006B3C',
                  margin: 0,
                }}
              >
                {editingAction ? 'Edit Action Taken' : 'Add Action Taken'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px',
                }}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div
                id="action-form-error"
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                }}
              >
                ⚠️ {formError}
              </div>
            )}

            <form noValidate onSubmit={handleSave}>
              {/* Row: Date/Time & Performed By */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <label
                    htmlFor="input-action-datetime"
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '4px',
                    }}
                  >
                    Action Date / Time <span style={{ color: '#B91C1C' }}>*</span>
                  </label>
                  <input
                    id="input-action-datetime"
                    type="datetime-local"
                    value={actionDateTime}
                    onChange={(e) => setActionDateTime(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="input-performed-by"
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '4px',
                    }}
                  >
                    Performed By (auto)
                  </label>
                  <input
                    id="input-performed-by"
                    type="text"
                    disabled
                    value={editingAction?.performedBy?.name ?? user?.name ?? 'IT Staff'}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB',
                      background: '#F3F4F6',
                      color: '#6B7280',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Action Description */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  htmlFor="input-action-description"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '4px',
                  }}
                >
                  Action Description <span style={{ color: '#B91C1C' }}>*</span>
                </label>
                <textarea
                  id="input-action-description"
                  rows={3}
                  value={actionDescription}
                  onChange={(e) => setActionDescription(e.target.value)}
                  placeholder="Detail the technical action taken or investigation conducted..."
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Result */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  htmlFor="input-action-result"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '4px',
                  }}
                >
                  Result / Outcome <span style={{ color: '#B91C1C' }}>*</span>
                </label>
                <textarea
                  id="input-action-result"
                  rows={3}
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="Outcome of the action, test findings, or status of resolution..."
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Follow-Up Required Checkbox */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    id="checkbox-follow-up-required"
                    type="checkbox"
                    checked={followUpRequired}
                    onChange={(e) => setFollowUpRequired(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#006B3C', cursor: 'pointer' }}
                  />
                  <span>Follow-Up Required?</span>
                </label>
              </div>

              {/* Follow-up Note (Conditional) */}
              {followUpRequired && (
                <div id="follow-up-note-container" style={{ marginBottom: '12px' }}>
                  <label
                    htmlFor="input-follow-up-note"
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#92400E',
                      marginBottom: '4px',
                    }}
                  >
                    Follow-up Note <span style={{ color: '#B91C1C' }}>*</span>
                  </label>
                  <textarea
                    id="input-follow-up-note"
                    rows={2}
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    placeholder="Specify the follow-up task, verification steps, or schedule..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #FCD34D',
                      background: '#FFFDF5',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              )}

              {/* Attachment Notes (Optional) */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="input-attachment-notes"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '4px',
                  }}
                >
                  Attachment Notes <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  id="input-attachment-notes"
                  type="text"
                  value={attachmentNotes}
                  onChange={(e) => setAttachmentNotes(e.target.value)}
                  placeholder="e.g. log-file.txt, screenshot-1.png"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Form Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  borderTop: '1px solid #E5E7EB',
                  paddingTop: '1rem',
                }}
              >
                <button
                  id="btn-cancel-action"
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#ffffff',
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  id="btn-save-action"
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#006B3C',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isSaving ? 'Saving…' : editingAction ? 'Update Action' : 'Save Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionsTakenSection;
