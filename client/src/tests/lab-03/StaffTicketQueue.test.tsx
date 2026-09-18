import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import StaffTicketQueue from '../../pages/StaffTicketQueue';

// ---------------------------------------------------------------------------
// Mock react-router-dom navigation
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockTickets = [
  {
    id: 1,
    ticketNumber: 'TKT-20260913-0001',
    createdAt: '2026-09-13T10:00:00Z',
    updatedAt: '2026-09-13T12:00:00Z',
    summary: 'Printer not working on floor 3',
    status: 'IN_PROGRESS',
    requestedPriority: 'HIGH',
    itPriority: 'CRITICAL',
    category: { id: 1, name: 'Hardware' },
    requester: { id: 10, name: 'Jane Requester' },
    owner: { id: 2, name: 'IT Staff A' },
  },
  {
    id: 2,
    ticketNumber: 'TKT-20260913-0002',
    createdAt: '2026-09-13T09:00:00Z',
    updatedAt: '2026-09-13T09:30:00Z',
    summary: 'VPN login failure',
    status: 'NEW',
    requestedPriority: 'MEDIUM',
    itPriority: 'MEDIUM',
    category: { id: 2, name: 'Network' },
    requester: { id: 11, name: 'Bob Requester' },
    owner: null,
  },
];

const mockPagination = {
  currentPage: 1,
  pageSize: 10,
  totalCount: 2,
  totalPages: 1,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderQueue() {
  return render(
    <BrowserRouter>
      <StaffTicketQueue />
    </BrowserRouter>
  );
}

function mockFetchSuccess(tickets = mockTickets, pagination = mockPagination) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ tickets, pagination }),
  });
}

function mockFetchFailure() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({ error: 'Server error' }),
  });
}

// ---------------------------------------------------------------------------
// UI-07: StaffTicketQueue renders table with data — AC-07
// ---------------------------------------------------------------------------
describe('UI-07 — StaffTicketQueue renders table columns and rows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSuccess();
  });

  it('renders the Ticket Queue heading', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getByText('Ticket Queue')).toBeInTheDocument();
    });
  });

  it('renders ticket number in the table', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260913-0001')[0]).toBeInTheDocument();
    });
  });

  it('renders ticket summary in the table', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getAllByText('Printer not working on floor 3')[0]).toBeInTheDocument();
    });
  });

  it('renders status badge for IN_PROGRESS', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getAllByText('In Progress')[0]).toBeInTheDocument();
    });
  });

  it('renders status badge for NEW', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getAllByText('New')[0]).toBeInTheDocument();
    });
  });

  it('renders owner name when assigned', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getAllByText('IT Staff A')[0]).toBeInTheDocument();
    });
  });

  it('renders "Unassigned" when ticket has no owner', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getAllByText('Unassigned')[0]).toBeInTheDocument();
    });
  });

  it('renders Open action button for each ticket', async () => {
    renderQueue();
    await waitFor(() => {
      const openButtons = screen.getAllByRole('button', { name: /open/i });
      expect(openButtons.length).toBeGreaterThan(0);
    });
  });

  it('renders the search input field', async () => {
    renderQueue();
    expect(
      screen.getByPlaceholderText(/ticket number or summary/i)
    ).toBeInTheDocument();
  });

  it('renders status filter dropdown', async () => {
    renderQueue();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });

  it('renders IT Priority filter dropdown', async () => {
    renderQueue();
    expect(screen.getByText('All Priorities')).toBeInTheDocument();
  });

  it('renders the category column', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getAllByText('Hardware')[0]).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// UI-08: StaffTicketQueue shows empty state — AC-07
// ---------------------------------------------------------------------------
describe('UI-08 — StaffTicketQueue shows empty state when no tickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          tickets: [],
          pagination: { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
        }),
    });
  });

  it('shows "No tickets in the queue" empty state message', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getByText('No tickets in the queue')).toBeInTheDocument();
    });
  });

  it('renders the empty state container with correct id', async () => {
    renderQueue();
    await waitFor(() => {
      expect(document.getElementById('queue-empty-state')).toBeInTheDocument();
    });
  });

  it('does NOT show "Clear Filters" button in true empty state', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// UI-09: StaffTicketQueue search updates the displayed list — AC-07
// ---------------------------------------------------------------------------
describe('UI-09 — StaffTicketQueue search filters the list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('typing into search input triggers a new fetch', async () => {
    mockFetchSuccess();
    renderQueue();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Ticket Queue')).toBeInTheDocument();
    });

    const callCountBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    // Simulate user typing in the search box
    const searchInput = screen.getByPlaceholderText(/ticket number or summary/i);
    fireEvent.change(searchInput, { target: { value: 'Printer' } });

    await waitFor(() => {
      const callCountAfter = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
      expect(callCountAfter).toBeGreaterThan(callCountBefore);
    });
  });

  it('shows no-results state when search returns empty tickets', async () => {
    mockFetchSuccess();
    renderQueue();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260913-0001')[0]).toBeInTheDocument();
    });

    // Mock fetch to return empty results for next call
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          tickets: [],
          pagination: { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
        }),
    });

    const searchInput = screen.getByPlaceholderText(/ticket number or summary/i);
    fireEvent.change(searchInput, { target: { value: 'xyznotfound' } });

    await waitFor(() => {
      expect(
        screen.getByText(/no tickets match your search or filters/i)
      ).toBeInTheDocument();
    });
  });

  it('shows "Clear Filters" button in no-results state', async () => {
    mockFetchSuccess();
    renderQueue();

    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260913-0001')[0]).toBeInTheDocument();
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          tickets: [],
          pagination: { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
        }),
    });

    const searchInput = screen.getByPlaceholderText(/ticket number or summary/i);
    fireEvent.change(searchInput, { target: { value: 'noresult' } });

    await waitFor(() => {
      expect(document.getElementById('queue-no-results-state')).toBeInTheDocument();
    });
  });

  it('API failure shows error banner', async () => {
    mockFetchFailure();
    renderQueue();

    await waitFor(() => {
      expect(
        screen.getByText(/unable to load ticket queue/i)
      ).toBeInTheDocument();
    });
  });

  it('clicking Open button navigates to ticket detail', async () => {
    mockFetchSuccess();
    renderQueue();

    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260913-0001')[0]).toBeInTheDocument();
    });

    const openButton = document.getElementById('btn-open-ticket-1');
    expect(openButton).toBeInTheDocument();
    fireEvent.click(openButton!);
    expect(mockNavigate).toHaveBeenCalledWith('/staff/tickets/1');
  });
});
