import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ActionsTakenSection, { ActionTaken } from '../../components/ActionsTakenSection';
import TicketDetailPage from '../../pages/TicketDetail';

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
const mockUser = { id: 2, name: 'IT Staff Test', role: 'IT_STAFF', email: 'staff@test.com' };
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
const mockActions: ActionTaken[] = [
  {
    id: 101,
    ticketId: 1,
    actionDateTime: '2026-10-27T09:30:00Z',
    actionDescription: 'Replaced faulty drum unit in the printer',
    result: 'Test page printed clearly without streaks',
    performedById: 2,
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: 'scan-sample.pdf',
    createdAt: '2026-10-27T09:35:00Z',
    updatedAt: '2026-10-27T09:35:00Z',
    performedBy: {
      id: 2,
      name: 'IT Staff Test',
      email: 'staff@test.com',
      role: 'IT_STAFF',
    },
  },
  {
    id: 102,
    ticketId: 1,
    actionDateTime: '2026-10-27T14:15:00Z',
    actionDescription: 'Updated network card firmware to v3.2',
    result: 'DHCP lease acquired, ping responses stable',
    performedById: 3,
    followUpRequired: true,
    followUpNote: 'Monitor network connection over 48 hours for packet drops',
    attachmentNotes: null,
    createdAt: '2026-10-27T14:20:00Z',
    updatedAt: '2026-10-27T14:20:00Z',
    performedBy: {
      id: 3,
      name: 'Senior Engineer',
      email: 'senior@test.com',
      role: 'IT_STAFF',
    },
  },
];

const mockTicketData = {
  id: 1,
  ticketNumber: 'TKT-20261027-0001',
  summary: 'Network printer connectivity failure',
  description: 'Printer drops offline intermittently.',
  status: 'IN_PROGRESS',
  requestedPriority: 'HIGH',
  itPriority: 'HIGH',
  requesterIndicatedResolved: false,
  createdAt: '2026-10-27T08:00:00Z',
  updatedAt: '2026-10-27T08:00:00Z',
  permittedStatuses: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  category: { id: 1, name: 'Hardware' },
  relatedSystem: { id: 1, name: 'Printer Network' },
  requester: { id: 10, name: 'Requester Alice', email: 'alice@test.com' },
  owner: { id: 2, name: 'IT Staff Test' },
  attachments: [],
  actionsTaken: mockActions,
};

describe('Actions Taken UI — Component Tests (Lab 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // UI-ACT-01: Render Actions Taken list on Staff Ticket Detail
  // ---------------------------------------------------------------------------
  describe('UI-ACT-01: Render Actions Taken list on Staff Ticket Detail', () => {
    it('renders the actions count badge and all recorded actions', () => {
      render(
        <ActionsTakenSection
          ticketId={1}
          actions={mockActions}
          readOnly={false}
        />
      );

      // Section header and count
      expect(screen.getByText('Actions Taken')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();

      // Descriptions
      expect(screen.getByText('Replaced faulty drum unit in the printer')).toBeInTheDocument();
      expect(screen.getByText('Updated network card firmware to v3.2')).toBeInTheDocument();

      // Results
      expect(screen.getByText('Test page printed clearly without streaks')).toBeInTheDocument();
      expect(screen.getByText('DHCP lease acquired, ping responses stable')).toBeInTheDocument();

      // Performed by actor badges
      expect(screen.getByText(/IT Staff Test/)).toBeInTheDocument();
      expect(screen.getByText(/Senior Engineer/)).toBeInTheDocument();

      // Follow-up note and tag
      expect(screen.getByText(/Follow-up Required/)).toBeInTheDocument();
      expect(screen.getByText(/Monitor network connection over 48 hours/)).toBeInTheDocument();

      // Attachment notes
      expect(screen.getByText('scan-sample.pdf')).toBeInTheDocument();

      // Add & Edit buttons are visible
      expect(screen.getByRole('button', { name: /Add Action Taken/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Edit/i })[0]).toBeInTheDocument();
    });

    it('renders empty state when there are 0 actions taken', () => {
      render(
        <ActionsTakenSection
          ticketId={1}
          actions={[]}
          readOnly={false}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText(/No actions taken recorded yet/i)).toBeInTheDocument();
    });

    it('opens add action modal and displays auto-recorded performed-by user', async () => {
      render(
        <ActionsTakenSection
          ticketId={1}
          actions={mockActions}
          readOnly={false}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Add Action Taken/i }));

      // Modal is visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Add Action Taken' })).toBeInTheDocument();

      // Auto-recorded performed by is disabled with current user name
      const performedByInput = screen.getByLabelText(/Performed By \(auto\)/i) as HTMLInputElement;
      expect(performedByInput).toBeInTheDocument();
      expect(performedByInput.disabled).toBe(true);
      expect(performedByInput.value).toBe('IT Staff Test');
    });

    it('opens edit modal pre-filled with the existing action details', async () => {
      render(
        <ActionsTakenSection
          ticketId={1}
          actions={mockActions}
          readOnly={false}
        />
      );

      const editBtns = screen.getAllByRole('button', { name: /Edit/i });
      fireEvent.click(editBtns[0]);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Action Taken')).toBeInTheDocument();

      const descTextarea = screen.getByLabelText(/Action Description/i) as HTMLTextAreaElement;
      expect(descTextarea.value).toBe('Replaced faulty drum unit in the printer');

      const resultTextarea = screen.getByLabelText(/Result \/ Outcome/i) as HTMLTextAreaElement;
      expect(resultTextarea.value).toBe('Test page printed clearly without streaks');
    });
  });

  // ---------------------------------------------------------------------------
  // UI-ACT-02: Follow-up checkbox toggles Follow-up Note input & validations
  // ---------------------------------------------------------------------------
  describe('UI-ACT-02: Follow-up checkbox toggles Follow-up Note input & field validations', () => {
    it('toggles Follow-up Note textarea dynamically based on checkbox state', () => {
      render(
        <ActionsTakenSection
          ticketId={1}
          actions={[]}
          readOnly={false}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Add Action Taken/i }));

      const checkbox = screen.getByRole('checkbox', { name: /Follow-Up Required\?/i }) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      // Follow-up Note textarea should NOT be present initially
      expect(screen.queryByLabelText(/Follow-up Note/i)).not.toBeInTheDocument();

      // Check the checkbox -> Follow-up Note textarea appears
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
      expect(screen.getByLabelText(/Follow-up Note/i)).toBeInTheDocument();

      // Uncheck -> Follow-up Note textarea disappears
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
      expect(screen.queryByLabelText(/Follow-up Note/i)).not.toBeInTheDocument();
    });

    it('validates required fields and shows error message when fields are empty', async () => {
      render(
        <ActionsTakenSection
          ticketId={1}
          actions={[]}
          readOnly={false}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Add Action Taken/i }));

      const saveBtn = screen.getByRole('button', { name: /Save Action/i });
      fireEvent.click(saveBtn);

      // Description is required
      expect(screen.getByText(/Action description is required/i)).toBeInTheDocument();

      // Fill description
      fireEvent.change(screen.getByLabelText(/Action Description/i), {
        target: { value: 'Investigated hardware components' },
      });
      fireEvent.click(saveBtn);

      // Result is required
      expect(screen.getByText(/Action result is required/i)).toBeInTheDocument();

      // Fill result and check follow-up required
      fireEvent.change(screen.getByLabelText(/Result \/ Outcome/i), {
        target: { value: 'Hardware test completed' },
      });
      const checkbox = screen.getByRole('checkbox', { name: /Follow-Up Required\?/i });
      fireEvent.click(checkbox);

      // Submit without followUpNote
      fireEvent.click(saveBtn);
      expect(screen.getByText(/Follow-up note is required when follow-up is requested/i)).toBeInTheDocument();
    });

    it('submits valid action to POST /api/tickets/:id/actions-taken successfully', async () => {
      const mockSaved = vi.fn();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ success: true, data: { id: 105 } }),
      });

      render(
        <ActionsTakenSection
          ticketId={1}
          actions={[]}
          readOnly={false}
          onActionSaved={mockSaved}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Add Action Taken/i }));

      fireEvent.change(screen.getByLabelText(/Action Description/i), {
        target: { value: 'Replaced toner cartridge' },
      });
      fireEvent.change(screen.getByLabelText(/Result \/ Outcome/i), {
        target: { value: 'Printer status OK' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Save Action/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tickets/1/actions-taken',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('Replaced toner cartridge'),
          })
        );
        expect(mockSaved).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // UI-ACT-03: Actions Taken on Requester Ticket Detail (Read-only)
  // ---------------------------------------------------------------------------
  describe('UI-ACT-03: Actions Taken on Requester Ticket Detail (Read-Only Mode)', () => {
    it('hides Add Action Taken and Edit buttons in readOnly mode', () => {
      render(
        <ActionsTakenSection
          ticketId={1}
          actions={mockActions}
          readOnly={true}
        />
      );

      // Section and items are rendered
      expect(screen.getByText('Actions Taken')).toBeInTheDocument();
      expect(screen.getByText('Replaced faulty drum unit in the printer')).toBeInTheDocument();
      expect(screen.getByText('Test page printed clearly without streaks')).toBeInTheDocument();

      // Neither + Add Action Taken nor Edit buttons should be present
      expect(screen.queryByRole('button', { name: /Add Action Taken/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument();
    });

    it('renders Actions Taken section in read-only mode inside TicketDetailPage for requesters', async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        const urlStr = String(url);
        if (urlStr.includes('/attachments')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          });
        }
        if (urlStr.includes('/api/tickets/1/actions-taken')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ actions: mockActions }),
          });
        }
        if (urlStr.includes('/api/tickets/1/comments')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ comments: [] }),
          });
        }
        if (urlStr.includes('/api/tickets/1')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockTicketData),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({}),
        });
      });

      render(
        <BrowserRouter>
          <TicketDetailPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'TKT-20261027-0001' })).toBeInTheDocument();
      });

      // Actions section is rendered
      expect(screen.getByText('Actions Taken')).toBeInTheDocument();
      expect(screen.getByText('Replaced faulty drum unit in the printer')).toBeInTheDocument();

      // Read-only: no Add/Edit controls for requester
      expect(screen.queryByRole('button', { name: /Add Action Taken/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument();
    });
  });
});
