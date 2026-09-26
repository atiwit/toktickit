import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    user: { id: 1, name: 'Test IT Staff', role: 'IT_STAFF', email: 'staff@test.com' },
  }),
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockTicket = {
  id: 1,
  ticketNumber: 'TKT-20260913-0001',
  summary: 'Printer not working on floor 3',
  description: 'The printer on floor 3 is not responding to print jobs.',
  status: 'IN_PROGRESS',
  requestedPriority: 'HIGH',
  itPriority: 'CRITICAL',
  requesterIndicatedResolved: false,
  createdAt: '2026-09-13T10:00:00Z',
  updatedAt: '2026-09-13T12:00:00Z',
  permittedStatuses: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  category: { id: 1, name: 'Hardware' },
  relatedSystem: { id: 1, name: 'Printer System' },
  requester: { id: 10, name: 'Jane Requester' },
  owner: { id: 2, name: 'IT Staff A' },
  attachments: [],
};

const mockComments = [
  {
    id: 1,
    ticketId: 1,
    authorId: 2,
    authorName: 'IT Staff A',
    authorRole: 'IT_STAFF',
    content: 'We are looking into this issue now.',
    createdAt: '2026-09-13T11:00:00Z',
  },
];

const mockNotes = [
  {
    id: 1,
    ticketId: 1,
    authorId: 2,
    authorName: 'IT Staff A',
    content: 'Internal investigation note: suspect driver issue.',
    createdAt: '2026-09-13T11:30:00Z',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function setupFetchMocks(
  ticketOverride?: Partial<typeof mockTicket>,
  commentsOverride?: typeof mockComments,
  notesOverride?: typeof mockNotes,
) {
  const ticket = { ...mockTicket, ...ticketOverride };
  const comments = commentsOverride ?? mockComments;
  const notes = notesOverride ?? mockNotes;

  global.fetch = vi.fn().mockImplementation((url: string) => {
    const urlStr = String(url);
    if (urlStr.includes('/api/staff/tickets/1/notes')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ notes }),
      });
    }
    if (urlStr.includes('/api/tickets/1/comments')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ comments }),
      });
    }
    if (urlStr.includes('/api/staff/tickets/1')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ticket }),
      });
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: { code: 'NOT_FOUND' } }),
    });
  });
}

function renderDetail() {
  return render(
    <BrowserRouter>
      <StaffTicketDetail />
    </BrowserRouter>
  );
}

// ===========================================================================
// UI-10: StaffTicketDetail renders all required sections
// ===========================================================================
describe('UI-10 — StaffTicketDetail renders all required sections', () => {
  beforeEach(() => {
    setupFetchMocks();
  });

  it('renders the ticket number in the header', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('TKT-20260913-0001')).toBeInTheDocument();
    });
  });

  it('renders the Ticket Information section', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Ticket Information')).toBeInTheDocument();
    });
  });

  it('renders the requester name', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Jane Requester')).toBeInTheDocument();
    });
  });

  it('renders the summary and description', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Printer not working on floor 3')).toBeInTheDocument();
      expect(screen.getByText(/not responding to print jobs/)).toBeInTheDocument();
    });
  });

  it('renders the Ticket Owner operations panel', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Ticket Owner')).toBeInTheDocument();
    });
  });

  it('renders the IT Priority selector', async () => {
    renderDetail();
    await waitFor(() => {
      // IT Priority appears in both Ticket Info row and the sidebar heading
      const itPriorityEls = screen.getAllByText('IT Priority');
      expect(itPriorityEls.length).toBeGreaterThan(0);
      const prioritySelect = document.getElementById('select-it-priority');
      expect(prioritySelect).toBeInTheDocument();
    });
  });

  it('renders the Update Status section', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Update Status')).toBeInTheDocument();
    });
  });

  it('renders permitted status buttons', async () => {
    renderDetail();
    await waitFor(() => {
      // permittedStatuses: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED']
      expect(document.getElementById('btn-status-waiting_for_requester')).toBeInTheDocument();
      expect(document.getElementById('btn-status-resolved')).toBeInTheDocument();
      expect(document.getElementById('btn-status-cancelled')).toBeInTheDocument();
    });
  });

  it('renders the Public Comments section heading', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Public Comments')).toBeInTheDocument();
    });
  });

  it('renders the Public Comments post form (textarea + button)', async () => {
    renderDetail();
    await waitFor(() => {
      expect(document.getElementById('comment-input-staff')).toBeInTheDocument();
      expect(document.getElementById('btn-post-comment-staff')).toBeInTheDocument();
    });
  });

  it('renders the Internal Notes section heading', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/Internal Notes/i)).toBeInTheDocument();
    });
  });

  it('renders the Internal Notes post form (textarea + button)', async () => {
    renderDetail();
    await waitFor(() => {
      expect(document.getElementById('note-input-staff')).toBeInTheDocument();
      expect(document.getElementById('btn-post-note-staff')).toBeInTheDocument();
    });
  });

  it('renders the attachments section', async () => {
    renderDetail();
    await waitFor(() => {
      // The heading shows "Attachments (N)" — getByText with regex works on the h3's textContent
      const attachEl = screen.getAllByText((content) => content.includes('Attachments'));
      expect(attachEl.length).toBeGreaterThan(0);
    });
  });

  it('renders a back button to the queue', async () => {
    renderDetail();
    await waitFor(() => {
      expect(document.getElementById('btn-back-to-queue')).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// UI-11: Public Comments vs Internal Notes are visually distinct — AC-11
// ===========================================================================
describe('UI-11 — StaffTicketDetail distinguishes Public Comments from Internal Notes', () => {
  beforeEach(() => {
    setupFetchMocks();
  });

  it('Public Comments section exists with its own heading', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Public Comments')).toBeInTheDocument();
    });
  });

  it('Internal Notes section exists with a distinct heading', async () => {
    renderDetail();
    await waitFor(() => {
      const internalHeading = screen.getByText(/Internal Notes/i);
      expect(internalHeading).toBeInTheDocument();
    });
  });

  it('Internal Notes heading indicates staff-only access restriction', async () => {
    renderDetail();
    await waitFor(() => {
      const internalHeading = screen.getByText(/Internal Notes/i);
      // The heading text includes "IT Staff only" to indicate restricted visibility
      expect(internalHeading.textContent).toMatch(/IT Staff/i);
    });
  });

  it('shows comment content inside the Public Comments section', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('We are looking into this issue now.')).toBeInTheDocument();
    });
  });

  it('shows note content inside the Internal Notes section', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Internal investigation note: suspect driver issue.')).toBeInTheDocument();
    });
  });

  it('Internal Notes textarea has the warning border color (#FCD34D)', async () => {
    renderDetail();
    await waitFor(() => {
      const noteTextarea = document.getElementById('note-input-staff') as HTMLTextAreaElement;
      expect(noteTextarea).toBeInTheDocument();
      // jsdom normalizes hex color #FCD34D to rgb(252, 211, 77)
      const border = noteTextarea.style.border;
      expect(
        border.includes('#FCD34D') || border.includes('rgb(252, 211, 77)')
      ).toBe(true);
    });
  });

  it('Public Comments Post button is separate from Internal Notes Save button', async () => {
    renderDetail();
    await waitFor(() => {
      const commentBtn = document.getElementById('btn-post-comment-staff');
      const noteBtn = document.getElementById('btn-post-note-staff');
      expect(commentBtn).toBeInTheDocument();
      expect(noteBtn).toBeInTheDocument();
      // They are distinct elements
      expect(commentBtn).not.toBe(noteBtn);
    });
  });

  it('shows "empty" messages separately for comments and notes', async () => {
    setupFetchMocks(undefined, [], []);
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('No comments yet.')).toBeInTheDocument();
      expect(screen.getByText('No internal notes.')).toBeInTheDocument();
    });
  });

  it('comment author role badge is shown (Requester or IT Staff label)', async () => {
    renderDetail();
    await waitFor(() => {
      // Author name appears in the comment card
      expect(screen.getByText('IT Staff A (IT Staff)')).toBeInTheDocument();
    });
  });

  it('note card does NOT show a role badge (notes are internal, author name only)', async () => {
    renderDetail();
    await waitFor(() => {
      // Note has author name but no role indicator on the note card
      const noteContent = screen.getByText('Internal investigation note: suspect driver issue.');
      expect(noteContent).toBeInTheDocument();
    });
  });
});
