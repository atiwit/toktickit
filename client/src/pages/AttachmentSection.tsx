import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  ListGroup,
  Modal,
  Spinner,
} from 'react-bootstrap';

export interface Attachment {
  id: number;
  ticketId: number;
  originalFilename: string;
  mimeType: string;
  size: number;
  isRemoved: boolean;
  removedReason: string | null;
  removedAt: string | null;
  uploadedAt: string;
}

interface AttachmentSectionProps {
  ticketId: number;
}


const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_EXTENSIONS = 'JPG, PNG, WEBP, PDF';
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const AttachmentSection: React.FC<AttachmentSectionProps> = ({ ticketId }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Remove-dialog state
  const [removeTarget, setRemoveTarget] = useState<Attachment | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);


  const loadAttachments = async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/attachments`);
      if (!res.ok) throw new Error('Failed to load attachments');
      const data = await res.json();
      setAttachments(data);
    } catch {
      setListError('Unable to load attachments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [ticketId]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadFile(file);
    setUploadError(null);

    if (file) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setUploadError(`File type not allowed. Accepted: ${ALLOWED_EXTENSIONS}.`);
      } else if (file.size > MAX_FILE_BYTES) {
        setUploadError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`);
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadError('Please select a file first.');
      return;
    }
    if (!ALLOWED_MIME_TYPES.includes(uploadFile.type)) {
      setUploadError(`File type not allowed. Accepted: ${ALLOWED_EXTENSIONS}.`);
      return;
    }
    if (uploadFile.size > MAX_FILE_BYTES) {
      setUploadError(`File too large. Maximum is 5 MB.`);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? 'Upload failed. Please try again.');
        return;
      }

      // Reset file input
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Reload list
      await loadAttachments();
    } catch {
      setUploadError('Unable to reach the server. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const openRemoveDialog = (attachment: Attachment) => {
    setRemoveTarget(attachment);
    setRemoveReason('');
    setRemoveError(null);
  };

  const closeRemoveDialog = () => {
    setRemoveTarget(null);
    setRemoveReason('');
    setRemoveError(null);
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;

    if (!removeReason.trim()) {
      setRemoveError('Please provide a reason for removal.');
      return;
    }

    setRemoving(true);
    setRemoveError(null);

    try {
      const res = await fetch(`/api/attachments/${removeTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: removeReason.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRemoveError(data.error ?? 'Remove failed. Please try again.');
        return;
      }

      closeRemoveDialog();
      await loadAttachments();
    } catch {
      setRemoveError('Unable to reach the server. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  const activeAttachments = attachments.filter((a) => !a.isRemoved);
  const removedAttachments = attachments.filter((a) => a.isRemoved);

  return (
    <div id="attachment-section">
      <Card className="form-card mb-4">
        <Card.Body>
          <h2 className="form-section-title">Upload Attachment</h2>
          <p className="form-section-hint">
            Accepted: {ALLOWED_EXTENSIONS} · Max 5 MB · Max 5 active per ticket.
          </p>

          <Form.Group controlId="attachment-upload-input" className="mb-3">
            <Form.Label className="visually-hidden">Select file</Form.Label>
            <Form.Control
              id="attachment-upload-input"
              type="file"
              ref={fileInputRef}
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileChange}
              isInvalid={!!uploadError}
              aria-describedby={uploadError ? 'upload-error' : undefined}
            />
            {uploadError && (
              <Form.Control.Feedback type="invalid" id="upload-error">
                {uploadError}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Button
            id="upload-btn"
            variant="primary"
            className="btn-zen"
            onClick={handleUpload}
            disabled={uploading || !uploadFile}
            aria-busy={uploading}
          >
            {uploading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden className="me-2" />
                Uploading…
              </>
            ) : (
              'Upload File'
            )}
          </Button>
        </Card.Body>
      </Card>

      <Card className="form-card mb-4">
        <Card.Body>
          <h2 className="form-section-title">
            Active Attachments{' '}
            <Badge bg="secondary" className="ms-2">
              {activeAttachments.length} / 5
            </Badge>
          </h2>

          {loading && (
            <div className="text-center py-3">
              <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
            </div>
          )}

          {listError && (
            <Alert variant="danger" id="attachment-list-error">
              {listError}
            </Alert>
          )}

          {!loading && !listError && activeAttachments.length === 0 && (
            <p className="text-muted" id="no-attachments-msg">
              No attachments yet.
            </p>
          )}

          {!loading && !listError && activeAttachments.length > 0 && (
            <ListGroup id="active-attachment-list">
              {activeAttachments.map((att) => (
                <ListGroup.Item
                  key={att.id}
                  className="d-flex justify-content-between align-items-center"
                  id={`attachment-item-${att.id}`}
                >
                  <div>
                    <span className="fw-semibold">{att.originalFilename}</span>{' '}
                    <span className="text-muted small">({formatBytes(att.size)})</span>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      id={`download-btn-${att.id}`}
                      variant="outline-primary"
                      size="sm"
                      href={`/api/attachments/${att.id}/download`}
                      as="a"
                      download
                    >
                      Download
                    </Button>
                    <Button
                      id={`remove-btn-${att.id}`}
                      variant="outline-danger"
                      size="sm"
                      onClick={() => openRemoveDialog(att)}
                    >
                      Remove
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {removedAttachments.length > 0 && (
        <Card className="form-card mb-4">
          <Card.Body>
            <h2 className="form-section-title">Removed Attachments</h2>
            <ListGroup id="removed-attachment-list">
              {removedAttachments.map((att) => (
                <ListGroup.Item
                  key={att.id}
                  className="text-muted"
                  id={`removed-item-${att.id}`}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="fw-semibold text-decoration-line-through">
                        {att.originalFilename}
                      </span>{' '}
                      <span className="small">({formatBytes(att.size)})</span>
                      <div className="small mt-1">
                        <span className="text-danger">Removed:</span>{' '}
                        {att.removedReason}
                        {att.removedAt && (
                          <> · {new Date(att.removedAt).toLocaleString()}</>
                        )}
                      </div>
                    </div>
                    <Badge bg="secondary">Removed</Badge>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      )}

      <Modal
        show={!!removeTarget}
        onHide={closeRemoveDialog}
        centered
        id="remove-confirm-dialog"
        aria-labelledby="remove-dialog-title"
      >
        <Modal.Header closeButton>
          <Modal.Title id="remove-dialog-title">Confirm Removal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {removeTarget && (
            <>
              <p>
                You are about to remove{' '}
                <strong>{removeTarget.originalFilename}</strong>. This action cannot
                be undone; the file will no longer be downloadable.
              </p>
              <Form.Group controlId="remove-reason-input">
                <Form.Label>
                  Reason for removal <span aria-hidden="true">*</span>
                </Form.Label>
                <Form.Control
                  id="remove-reason-input"
                  as="textarea"
                  rows={3}
                  value={removeReason}
                  onChange={(e) => {
                    setRemoveReason(e.target.value);
                    if (removeError) setRemoveError(null);
                  }}
                  isInvalid={!!removeError}
                  maxLength={500}
                  placeholder="Describe why this file is being removed…"
                />
                {removeError && (
                  <Form.Control.Feedback type="invalid">
                    {removeError}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            id="cancel-remove-btn"
            variant="secondary"
            onClick={closeRemoveDialog}
            disabled={removing}
          >
            Cancel
          </Button>
          <Button
            id="confirm-remove-btn"
            variant="danger"
            onClick={handleConfirmRemove}
            disabled={removing}
            aria-busy={removing}
          >
            {removing ? (
              <>
                <Spinner as="span" animation="border" size="sm" aria-hidden className="me-2" />
                Removing…
              </>
            ) : (
              'Confirm Remove'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AttachmentSection;
