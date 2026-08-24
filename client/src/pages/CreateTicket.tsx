import React, { useEffect, useState, useRef } from 'react';
import {
  Row,
  Col,
  Form,
  Button,
  Alert,
  Spinner,
  Card,
  Badge,
} from 'react-bootstrap';
import { useRequester } from '../context/RequesterContext';

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

interface Category {
  id: number;
  name: string;
}

interface RelatedSystem {
  id: number;
  name: string;
}

interface FieldErrors {
  categoryId?: string;
  relatedSystemId?: string;
  requestedPriority?: string;
  summary?: string;
  description?: string;
  attachment?: string;
}

interface CreatedTicket {
  id: number;
  ticketNumber: string;
  status: string;
  requestedPriority: string;
  summary: string;
  category: { name: string };
  relatedSystem: { name: string };
  createdAt: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_EXTENSIONS = 'JPG, PNG, WEBP, PDF';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const PRIORITY_OPTIONS = [
  { value: '', label: '— Select Priority —' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const PRIORITY_BADGE_VARIANT: Record<string, string> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'dark',
};

// ───────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────

const CreateTicket: React.FC = () => {
  const { selectedRequester } = useRequester();

  // Reference data
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [refLoading, setRefLoading] = useState(true);
  const [refError, setRefError] = useState<string | null>(null);

  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [relatedSystemId, setRelatedSystemId] = useState('');
  const [requestedPriority, setRequestedPriority] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Validation
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<CreatedTicket | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load reference data ───────────────────────
  useEffect(() => {
    const load = async () => {
      setRefLoading(true);
      setRefError(null);
      try {
        const [catRes, sysRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/related-systems'),
        ]);
        if (!catRes.ok || !sysRes.ok) throw new Error('Failed to load reference data');
        const [cats, systems] = await Promise.all([catRes.json(), sysRes.json()]);
        setCategories(cats);
        setRelatedSystems(systems);
      } catch {
        setRefError('Unable to load form data. Please check the server connection and try again.');
      } finally {
        setRefLoading(false);
      }
    };
    load();
  }, []);

  // ─── Field-level validation ────────────────────
  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!categoryId) errors.categoryId = 'Category is required.';
    if (!relatedSystemId) errors.relatedSystemId = 'Related System is required.';
    if (!requestedPriority) errors.requestedPriority = 'Priority is required.';
    if (!summary.trim()) {
      errors.summary = 'Summary is required.';
    } else if (summary.trim().length > 200) {
      errors.summary = `Summary must be 200 characters or less (currently ${summary.trim().length}).`;
    }
    if (!description.trim()) {
      errors.description = 'Description is required.';
    } else if (description.trim().length > 2000) {
      errors.description = `Description must be 2000 characters or less (currently ${description.trim().length}).`;
    }
    if (attachmentFile) {
      if (!ALLOWED_MIME_TYPES.includes(attachmentFile.type)) {
        errors.attachment = `File type not allowed. Accepted types: ${ALLOWED_EXTENSIONS}.`;
      } else if (attachmentFile.size > MAX_FILE_SIZE_BYTES) {
        errors.attachment = `File is too large (${(attachmentFile.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 5 MB.`;
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── Handle file change ────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAttachmentFile(file);

    // Immediate attachment validation feedback
    if (file) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setFieldErrors((prev) => ({
          ...prev,
          attachment: `File type not allowed. Accepted types: ${ALLOWED_EXTENSIONS}.`,
        }));
      } else if (file.size > MAX_FILE_SIZE_BYTES) {
        setFieldErrors((prev) => ({
          ...prev,
          attachment: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`,
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, attachment: undefined }));
      }
    } else {
      setFieldErrors((prev) => ({ ...prev, attachment: undefined }));
    }
  };

  // ─── Form submission ───────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: selectedRequester!.id,
          categoryId: Number(categoryId),
          relatedSystemId: Number(relatedSystemId),
          requestedPriority,
          summary: summary.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Server-side validation errors → map to field errors
        if (data.fields) {
          const mapped: FieldErrors = {};
          if (data.fields.categoryId) mapped.categoryId = data.fields.categoryId;
          if (data.fields.relatedSystemId) mapped.relatedSystemId = data.fields.relatedSystemId;
          if (data.fields.requestedPriority) mapped.requestedPriority = data.fields.requestedPriority;
          if (data.fields.summary) mapped.summary = data.fields.summary;
          if (data.fields.description) mapped.description = data.fields.description;
          setFieldErrors(mapped);
        } else {
          setApiError(data.error ?? 'An unexpected error occurred. Please try again.');
        }
        return;
      }

      setCreatedTicket(data);
    } catch {
      // Network / server down — preserve form values (do NOT reset)
      setApiError('Unable to reach the server. Your form data has been preserved — please try again when the connection is restored.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Reset form for another ticket ────────────
  const handleCreateAnother = () => {
    setCategoryId('');
    setRelatedSystemId('');
    setRequestedPriority('');
    setSummary('');
    setDescription('');
    setAttachmentFile(null);
    setFieldErrors({});
    setApiError(null);
    setCreatedTicket(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Loading reference data ────────────────────
  if (refLoading) {
    return (
      <div className="create-ticket-loading" id="create-ticket-loading">
        <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
        <p className="mt-3 text-muted">Loading form data…</p>
      </div>
    );
  }

  if (refError) {
    return (
      <Alert variant="danger" id="create-ticket-ref-error" className="mt-4">
        <Alert.Heading>Unable to Load Form</Alert.Heading>
        <p>{refError}</p>
        <Button
          id="create-ticket-retry-btn"
          variant="outline-danger"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  // ─── Success state ─────────────────────────────
  if (createdTicket) {
    return (
      <div id="create-ticket-success">
        <div className="create-ticket-header mb-4">
          <h1 className="create-ticket-title">Ticket Submitted</h1>
        </div>

        <Card className="create-ticket-success-card">
          <Card.Body>
            <div className="success-icon-wrap">
              <span className="success-icon" aria-hidden="true">✓</span>
            </div>
            <h2 className="success-headline">Your ticket has been created!</h2>
            <p className="success-sub">
              Save your ticket number for reference. You can find this ticket in <em>My Tickets</em>.
            </p>

            <div className="ticket-number-display" id="created-ticket-number">
              {createdTicket.ticketNumber}
            </div>

            <div className="success-details">
              <div className="success-detail-row">
                <span className="detail-label">Summary</span>
                <span className="detail-value">{createdTicket.summary}</span>
              </div>
              <div className="success-detail-row">
                <span className="detail-label">Category</span>
                <span className="detail-value">{createdTicket.category.name}</span>
              </div>
              <div className="success-detail-row">
                <span className="detail-label">Related System</span>
                <span className="detail-value">{createdTicket.relatedSystem.name}</span>
              </div>
              <div className="success-detail-row">
                <span className="detail-label">Priority</span>
                <span className="detail-value">
                  <Badge bg={PRIORITY_BADGE_VARIANT[createdTicket.requestedPriority] ?? 'secondary'}>
                    {createdTicket.requestedPriority}
                  </Badge>
                </span>
              </div>
              <div className="success-detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  <Badge bg="secondary">{createdTicket.status}</Badge>
                </span>
              </div>
              <div className="success-detail-row">
                <span className="detail-label">Submitted</span>
                <span className="detail-value">
                  {new Date(createdTicket.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="success-actions">
              <Button
                id="create-another-btn"
                variant="primary"
                className="btn-zen"
                onClick={handleCreateAnother}
              >
                Create Another Ticket
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // ─── Main form ─────────────────────────────────
  return (
    <div id="create-ticket-page">
      <div className="create-ticket-header mb-4">
        <h1 className="create-ticket-title">Create New Ticket</h1>
        <p className="create-ticket-sub">
          Submitting as <strong>{selectedRequester?.name}</strong>
        </p>
      </div>

      {/* Safe error state — form values preserved */}
      {apiError && (
        <Alert
          variant="danger"
          id="create-ticket-api-error"
          className="mb-4"
          onClose={() => setApiError(null)}
          dismissible
        >
          <Alert.Heading>Submission Failed</Alert.Heading>
          <p className="mb-0">{apiError}</p>
        </Alert>
      )}

      <Form id="create-ticket-form" onSubmit={handleSubmit} noValidate>
        <Card className="form-card mb-4">
          <Card.Body>
            <h2 className="form-section-title">Ticket Details</h2>

            {/* System-generated fields (read-only) */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="field-ticket-number">
                  <Form.Label>
                    Ticket Number
                    <span className="read-only-tag ms-2">System-generated</span>
                  </Form.Label>
                  <Form.Control
                    id="field-ticket-number"
                    type="text"
                    readOnly
                    value="Will be assigned on submission"
                    className="form-control-readonly"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="field-status">
                  <Form.Label>
                    Status
                    <span className="read-only-tag ms-2">System-generated</span>
                  </Form.Label>
                  <Form.Control
                    id="field-status"
                    type="text"
                    readOnly
                    value="NEW"
                    className="form-control-readonly"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Category & Related System */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="field-category">
                  <Form.Label>
                    Category <span className="required-asterisk" aria-hidden="true">*</span>
                  </Form.Label>
                  <Form.Select
                    id="field-category"
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      if (e.target.value) setFieldErrors((p) => ({ ...p, categoryId: undefined }));
                    }}
                    isInvalid={!!fieldErrors.categoryId}
                    aria-required="true"
                    aria-describedby={fieldErrors.categoryId ? 'error-category' : undefined}
                  >
                    <option value="">— Select Category —</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Form.Select>
                  {fieldErrors.categoryId && (
                    <Form.Control.Feedback type="invalid" id="error-category">
                      {fieldErrors.categoryId}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="field-related-system">
                  <Form.Label>
                    Related System <span className="required-asterisk" aria-hidden="true">*</span>
                  </Form.Label>
                  <Form.Select
                    id="field-related-system"
                    value={relatedSystemId}
                    onChange={(e) => {
                      setRelatedSystemId(e.target.value);
                      if (e.target.value) setFieldErrors((p) => ({ ...p, relatedSystemId: undefined }));
                    }}
                    isInvalid={!!fieldErrors.relatedSystemId}
                    aria-required="true"
                    aria-describedby={fieldErrors.relatedSystemId ? 'error-related-system' : undefined}
                  >
                    <option value="">— Select Related System —</option>
                    {relatedSystems.map((sys) => (
                      <option key={sys.id} value={sys.id}>
                        {sys.name}
                      </option>
                    ))}
                  </Form.Select>
                  {fieldErrors.relatedSystemId && (
                    <Form.Control.Feedback type="invalid" id="error-related-system">
                      {fieldErrors.relatedSystemId}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            {/* Priority */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="field-priority">
                  <Form.Label>
                    Priority <span className="required-asterisk" aria-hidden="true">*</span>
                  </Form.Label>
                  <Form.Select
                    id="field-priority"
                    value={requestedPriority}
                    onChange={(e) => {
                      setRequestedPriority(e.target.value);
                      if (e.target.value) setFieldErrors((p) => ({ ...p, requestedPriority: undefined }));
                    }}
                    isInvalid={!!fieldErrors.requestedPriority}
                    aria-required="true"
                    aria-describedby={fieldErrors.requestedPriority ? 'error-priority' : undefined}
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                  {fieldErrors.requestedPriority && (
                    <Form.Control.Feedback type="invalid" id="error-priority">
                      {fieldErrors.requestedPriority}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            {/* Summary */}
            <Form.Group className="mb-3" controlId="field-summary">
              <Form.Label>
                Summary <span className="required-asterisk" aria-hidden="true">*</span>
              </Form.Label>
              <Form.Control
                id="field-summary"
                type="text"
                placeholder="Brief description of the issue (max 200 characters)"
                value={summary}
                maxLength={200}
                onChange={(e) => {
                  setSummary(e.target.value);
                  if (e.target.value.trim()) setFieldErrors((p) => ({ ...p, summary: undefined }));
                }}
                isInvalid={!!fieldErrors.summary}
                aria-required="true"
                aria-describedby={fieldErrors.summary ? 'error-summary' : 'hint-summary'}
              />
              <div className="char-counter" id="hint-summary" aria-live="polite">
                {summary.length} / 200
              </div>
              {fieldErrors.summary && (
                <Form.Control.Feedback type="invalid" id="error-summary">
                  {fieldErrors.summary}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            {/* Description */}
            <Form.Group className="mb-3" controlId="field-description">
              <Form.Label>
                Description <span className="required-asterisk" aria-hidden="true">*</span>
              </Form.Label>
              <Form.Control
                id="field-description"
                as="textarea"
                rows={5}
                placeholder="Provide detailed information about the issue (max 2000 characters)"
                value={description}
                maxLength={2000}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (e.target.value.trim()) setFieldErrors((p) => ({ ...p, description: undefined }));
                }}
                isInvalid={!!fieldErrors.description}
                aria-required="true"
                aria-describedby={fieldErrors.description ? 'error-description' : 'hint-description'}
              />
              <div className="char-counter" id="hint-description" aria-live="polite">
                {description.length} / 2000
              </div>
              {fieldErrors.description && (
                <Form.Control.Feedback type="invalid" id="error-description">
                  {fieldErrors.description}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Card.Body>
        </Card>

        {/* Attachment section */}
        <Card className="form-card mb-4">
          <Card.Body>
            <h2 className="form-section-title">Attachment (Optional)</h2>
            <p className="form-section-hint">
              Accepted formats: {ALLOWED_EXTENSIONS} · Maximum size: 5 MB · Max 5 attachments per ticket.
            </p>

            <Form.Group controlId="field-attachment">
              <Form.Label className="visually-hidden">Attachment</Form.Label>
              <Form.Control
                id="field-attachment"
                type="file"
                ref={fileInputRef}
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileChange}
                isInvalid={!!fieldErrors.attachment}
                aria-describedby={fieldErrors.attachment ? 'error-attachment' : 'hint-attachment'}
              />
              <Form.Text id="hint-attachment" className="text-muted">
                Attachment upload to ticket will be available after ticket creation (Issue #5).
              </Form.Text>
              {fieldErrors.attachment && (
                <Form.Control.Feedback type="invalid" id="error-attachment">
                  {fieldErrors.attachment}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Card.Body>
        </Card>

        {/* Submit */}
        <div className="form-actions">
          <Button
            id="submit-ticket-btn"
            variant="primary"
            type="submit"
            className="btn-zen btn-zen-lg"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Submitting…
              </>
            ) : (
              'Submit Ticket'
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CreateTicket;
