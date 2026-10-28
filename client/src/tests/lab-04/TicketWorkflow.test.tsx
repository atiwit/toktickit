import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import StaffTicketDetail from '../../pages/StaffTicketDetail';

// ---------------------------------------------------------------------------
// Mock react-router-dom
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  };
});

// ---------------------------------------------------------------------------
// Mock AuthContext
// ---------------------------------------------------------------------------
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 2, name: 'IT Staff Hero', role: 'IT_STAFF', email: 'hero@test.com' },
  }),
}));

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
const mockTicketWithoutActions = {
  id: 1,
  ticketNumber: 'TKT-20261028-0001',
  summary: 'VPN disconnects repeatedly',
  description: 'Employee cannot sustain VPN tunnel.',
  status: 'IN_PROGRESS',
  requestedPriority: 'HIGH',
  itPriority: 'HIGH',
  requesterIndicatedResolved: false,
  createdAt: '2026-10-28T08:00:00Z',
  updatedAt: '2026-10-28T09:00:00Z',
  permittedStatuses: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  category: { id: 1, name: 'Network' },
  relatedSystem: { id: 2, name: 'Corporate VPN' },
  requester: { id: 15, name: 'Bob Requester', email: 'bob@test.com' },
  owner: { id: 2, name: 'IT Staff Hero' },
  attachments: [],
  actionsTaken: [],
};

const mockAction = {
  id: 99,
  ticketId: 1,
  actionDateTime: '2026-10-28T09:30:00Z',
  actionDescription: 'Reinstalled VPN client certificates and re-routed gateway',
  result: 'Tunnel established stably for 30 minutes',
  performedById: 2,
  followUpRequired: false,
  followUpNote: null,
  attachmentNotes: null,
  createdAt: '2026-10-28T09:35:00Z',
  updatedAt: '2026-10-28T09:35:00Z',
  performedBy: { id: 2, name: 'IT Staff Hero', email: 'hero@test.com', role: 'IT_STAFF' },
};

function setupFetchMock(ticketData = mockTicketWithoutActions, actionsData: any[] = []) {
  global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
    const urlStr = String(url);

    // GET /api/tickets/1/actions-taken
    if (urlStr.includes('/api/tickets/1/actions-taken') && (!opts || opts.method === 'GET' || !opts.method)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ actions: actionsData }),
      });
    }

    // POST /api/tickets/1/actions-taken
    if (urlStr.includes('/api/tickets/1/actions-taken') && opts?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ success: true, data: mockAction }),
      });
    }

    // GET /api/staff/tickets/1/notes
    if (urlStr.includes('/api/staff/tickets/1/notes')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ notes: [] }),
      });
    }

    // GET /api/tickets/1/comments
    if (urlStr.includes('/api/tickets/1/comments')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ comments: [] }),
      });
    }

    // PATCH /api/staff/tickets/1/status
    if (urlStr.includes('/api/staff/tickets/1/status') && opts?.method === 'PATCH') {
      const body = JSON.parse(opts.body ?? '{}');
      if (body.status === 'RESOLVED' && actionsData.length === 0) {
        return Promise.resolve({
          ok: false,
          status: 422,
          json: () => Promise.resolve({
            error: {
              code: 'RESOLUTION_GATE_BLOCKED',
              message: 'Cannot resolve ticket: At least one Action Taken must be recorded.',
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          message: 'Status updated successfully',
          data: {
            id: 1,
            ticketNumber: ticketData.ticketNumber,
            status: body.status,
            updatedAt: '2026-10-28T10:00:00Z',
            permittedStatuses: body.status === 'RESOLVED' ? ['CLOSED', 'REOPENED'] : ['RESOLVED', 'CANCELLED'],
          },
        }),
      });
    }

    // GET /api/staff/tickets/1
    if (urlStr.includes('/api/staff/tickets/1')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ticket: { ...ticketData, actionsTaken: actionsData } }),
      });
    }

    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });
  });
}

describe('Ticket Workflow & Resolution Gate UI — Component Tests (Lab 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // UI-WF-01: Resolution Gate UI alert when resolving without action
  // ---------------------------------------------------------------------------
  describe('UI-WF-01: Resolution Gate UI alert when resolving without action', () => {
    it('intercepts transition to Resolved and displays Resolution Gate alert banner when ticket has 0 actions', async () => {
      setupFetchMock(mockTicketWithoutActions, []);

      render(
        <BrowserRouter>
          <StaffTicketDetail />
        </BrowserRouter>
      );

      // Wait for ticket to load
      await waitFor(() => {
        expect(screen.getByText('TKT-20261028-0001')).toBeInTheDocument();
      });

      // Status buttons are visible
      const resolveBtn = screen.getByRole('button', { name: /→ Resolved/i });
      expect(resolveBtn).toBeInTheDocument();

      // Click "→ Resolved" while actions.length === 0
      fireEvent.click(resolveBtn);

      // Resolution Gate Alert banner appears
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Cannot Resolve Ticket:/i)).toBeInTheDocument();
      expect(
        screen.getByText(/You must record at least one Action Taken describing the solution before marking this ticket as Resolved/i)
      ).toBeInTheDocument();

      // Shortcut button "+ Add Action Taken Now" is present
      const shortcutBtn = screen.getByRole('button', { name: /\+ Add Action Taken Now/i });
      expect(shortcutBtn).toBeInTheDocument();
    });

    it('clicking "+ Add Action Taken Now" opens Add Action Taken dialog and dismisses alert', async () => {
      setupFetchMock(mockTicketWithoutActions, []);

      render(
        <BrowserRouter>
          <StaffTicketDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('TKT-20261028-0001')).toBeInTheDocument();
      });

      // Trigger resolution gate alert
      fireEvent.click(screen.getByRole('button', { name: /→ Resolved/i }));
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Click shortcut button
      fireEvent.click(screen.getByRole('button', { name: /\+ Add Action Taken Now/i }));

      // Alert is dismissed and Add Action Taken modal is opened
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Add Action Taken' })).toBeInTheDocument();
    });

    it('allows transition to RESOLVED when ticket has at least 1 action taken', async () => {
      setupFetchMock(mockTicketWithoutActions, [mockAction]);

      render(
        <BrowserRouter>
          <StaffTicketDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('TKT-20261028-0001')).toBeInTheDocument();
      });

      // Action is listed
      expect(screen.getByText('Reinstalled VPN client certificates and re-routed gateway')).toBeInTheDocument();

      // Click "→ Resolved"
      fireEvent.click(screen.getByRole('button', { name: /→ Resolved/i }));

      // Alert should NOT be shown
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // PATCH /api/staff/tickets/1/status was invoked with RESOLVED
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/staff/tickets/1/status',
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('"status":"RESOLVED"'),
          })
        );
      });
    });

    it('displays resolution gate banner if backend returns 422 RESOLUTION_GATE_BLOCKED', async () => {
      // Setup fetch where status update returns 422
      global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/staff/tickets/1/status') && opts?.method === 'PATCH') {
          return Promise.resolve({
            ok: false,
            status: 422,
            json: () => Promise.resolve({
              error: {
                code: 'RESOLUTION_GATE_BLOCKED',
                message: 'Cannot resolve ticket: At least one Action Taken must be recorded.',
              },
            }),
          });
        }
        if (urlStr.includes('/api/tickets/1/actions-taken')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ actions: [mockAction] }) });
        }
        if (urlStr.includes('/api/staff/tickets/1/notes')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ notes: [] }) });
        }
        if (urlStr.includes('/api/tickets/1/comments')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ comments: [] }) });
        }
        if (urlStr.includes('/api/staff/tickets/1')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ticket: { ...mockTicketWithoutActions, actionsTaken: [mockAction] } }) });
        }
        return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
      });

      render(
        <BrowserRouter>
          <StaffTicketDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('TKT-20261028-0001')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /→ Resolved/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.getByText(/Cannot Resolve Ticket:/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // UI-WF-02: Status dropdown / button options restricted by matrix
  // ---------------------------------------------------------------------------
  describe('UI-WF-02: Status options restricted by permitted transition matrix', () => {
    it('renders only the statuses specified in permittedStatuses', async () => {
      // permittedStatuses: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED']
      setupFetchMock(mockTicketWithoutActions, []);

      render(
        <BrowserRouter>
          <StaffTicketDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('TKT-20261028-0001')).toBeInTheDocument();
      });

      // Permitted buttons must exist
      expect(screen.getByRole('button', { name: /→ Waiting for Requester/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /→ Resolved/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /→ Cancelled/i })).toBeInTheDocument();

      // Non-permitted statuses must NOT exist as buttons
      expect(screen.queryByRole('button', { name: /→ New/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /→ Open/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /→ In Progress/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /→ Closed/i })).not.toBeInTheDocument();
    });

    it('clicking a non-destructive transition updates status with lastUpdatedAt for OCC', async () => {
      setupFetchMock(mockTicketWithoutActions, []);

      render(
        <BrowserRouter>
          <StaffTicketDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('TKT-20261028-0001')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /→ Waiting for Requester/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/staff/tickets/1/status',
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'WAITING_FOR_REQUESTER',
              lastUpdatedAt: '2026-10-28T09:00:00Z',
            }),
          })
        );
      });
    });

    it('clicking a destructive transition like Cancel opens confirmation dialog before proceeding', async () => {
      setupFetchMock(mockTicketWithoutActions, []);

      render(
        <BrowserRouter>
          <StaffTicketDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('TKT-20261028-0001')).toBeInTheDocument();
      });

      // Click Cancelled button
      fireEvent.click(screen.getByRole('button', { name: /→ Cancelled/i }));

      // Dialog is displayed
      expect(screen.getByText('Cancel Ticket')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to cancel this ticket\?/i)).toBeInTheDocument();

      // Status is NOT changed yet
      expect(global.fetch).not.toHaveBeenCalledWith(
        '/api/staff/tickets/1/status',
        expect.anything()
      );

      // Confirm in dialog
      fireEvent.click(screen.getByRole('button', { name: /Yes, Cancel Ticket/i }));

      // Now PATCH is called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/staff/tickets/1/status',
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('"status":"CANCELLED"'),
          })
        );
      });
    });
  });
});
