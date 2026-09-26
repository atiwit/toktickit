import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
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

// ---------------------------------------------------------------------------
// UI-10: Pagination retains search and filter states
// ---------------------------------------------------------------------------
describe('UI-10 — Pagination retains search and filter states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigating to next page preserves search and filter parameters in API request and UI inputs', async () => {
    const multiPagePagination = {
      currentPage: 1,
      pageSize: 10,
      totalCount: 25,
      totalPages: 3,
    };
    mockFetchSuccess(mockTickets, multiPagePagination);
    renderQueue();

    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260913-0001')[0]).toBeInTheDocument();
    });

    // Enter search and filters
    const searchInput = screen.getByPlaceholderText(/ticket number or summary/i);
    const statusSelect = document.getElementById('queue-status-filter') as HTMLSelectElement;
    const prioritySelect = document.getElementById('queue-priority-filter') as HTMLSelectElement;

    fireEvent.change(searchInput, { target: { value: 'Printer' } });
    fireEvent.change(statusSelect, { target: { value: 'IN_PROGRESS' } });
    fireEvent.change(prioritySelect, { target: { value: 'CRITICAL' } });

    await waitFor(() => {
      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const lastCallUrl = calls[calls.length - 1][0] as string;
      expect(lastCallUrl).toContain('search=Printer');
      expect(lastCallUrl).toContain('status=IN_PROGRESS');
      expect(lastCallUrl).toContain('itPriority=CRITICAL');
    });

    // Mock next fetch response for page 2
    mockFetchSuccess(mockTickets, { ...multiPagePagination, currentPage: 2 });

    // Click Next button
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    // Verify fetch called with page=2 and preserving all filters
    await waitFor(() => {
      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const lastCallUrl = calls[calls.length - 1][0] as string;
      expect(lastCallUrl).toContain('page=2');
      expect(lastCallUrl).toContain('search=Printer');
      expect(lastCallUrl).toContain('status=IN_PROGRESS');
      expect(lastCallUrl).toContain('itPriority=CRITICAL');
    });

    // Verify UI inputs still retain their values
    expect(searchInput).toHaveValue('Printer');
    expect(statusSelect).toHaveValue('IN_PROGRESS');
    expect(prioritySelect).toHaveValue('CRITICAL');
  });

  it('clicking numbered page button preserves filters', async () => {
    const multiPagePagination = {
      currentPage: 1,
      pageSize: 10,
      totalCount: 25,
      totalPages: 3,
    };
    mockFetchSuccess(mockTickets, multiPagePagination);
    renderQueue();

    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260913-0001')[0]).toBeInTheDocument();
    });

    const statusSelect = document.getElementById('queue-status-filter') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'OPEN' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('status=OPEN'), expect.any(Object));
    });

    mockFetchSuccess(mockTickets, { ...multiPagePagination, currentPage: 2 });

    // Click page number "2"
    const page2Btn = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Btn);

    await waitFor(() => {
      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const lastCallUrl = calls[calls.length - 1][0] as string;
      expect(lastCallUrl).toContain('page=2');
      expect(lastCallUrl).toContain('status=OPEN');
    });
  });

  it('changing search or filter while on page > 1 resets page back to 1', async () => {
    const multiPagePagination = {
      currentPage: 2,
      pageSize: 10,
      totalCount: 25,
      totalPages: 3,
    };
    mockFetchSuccess(mockTickets, multiPagePagination);
    renderQueue();

    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260913-0001')[0]).toBeInTheDocument();
    });

    // Navigate to page 2 first
    const page2Btn = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Btn);

    await waitFor(() => {
      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const lastCallUrl = calls[calls.length - 1][0] as string;
      expect(lastCallUrl).toContain('page=2');
    });

    // Now user types a new search query while on page 2
    const searchInput = screen.getByPlaceholderText(/ticket number or summary/i);
    fireEvent.change(searchInput, { target: { value: 'Network' } });

    await waitFor(() => {
      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const lastCallUrl = calls[calls.length - 1][0] as string;
      expect(lastCallUrl).toContain('page=1');
      expect(lastCallUrl).toContain('search=Network');
    });
  });

  it('boundary conditions: Prev button is disabled on first page, Next is disabled on last page', async () => {
    mockFetchSuccess(mockTickets, {
      currentPage: 1,
      pageSize: 10,
      totalCount: 20,
      totalPages: 2,
    });
    renderQueue();

    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260913-0001')[0]).toBeInTheDocument();
    });

    const prevBtn = screen.getByRole('button', { name: /prev/i });
    const nextBtn = screen.getByRole('button', { name: /next/i });

    // Page 1: Prev disabled, Next enabled
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    // Move to page 2 (last page)
    mockFetchSuccess(mockTickets, {
      currentPage: 2,
      pageSize: 10,
      totalCount: 20,
      totalPages: 2,
    });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(prevBtn).toBeEnabled();
      expect(nextBtn).toBeDisabled();
    });
  });
});

// ---------------------------------------------------------------------------
// UI-11: Responsive behavior & viewport adaptation
// ---------------------------------------------------------------------------
describe('UI-11 — Responsive behavior & viewport adaptation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSuccess();
  });

  it('desktop view renders the desktop table container and full column headers', async () => {
    renderQueue();

    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260913-0001')[0]).toBeInTheDocument();
    });

    const desktopContainer = document.getElementById('queue-table-desktop');
    expect(desktopContainer).toBeInTheDocument();

    // Check all desktop table headers within the desktop container
    const expectedHeaders = [
      'Ticket #', 'Created', 'Summary', 'Category',
      'Req. Priority', 'IT Priority', 'Status', 'Owner',
      'Last Updated', 'Action',
    ];
    for (const h of expectedHeaders) {
      expect(within(desktopContainer!).getByText(new RegExp(h, 'i'))).toBeInTheDocument();
    }
  });

  it('mobile view renders mobile card stack with ticket details', async () => {
    renderQueue();

    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260913-0001')[0]).toBeInTheDocument();
    });

    const mobileContainer = document.getElementById('queue-list-mobile');
    expect(mobileContainer).toBeInTheDocument();

    // Ticket info rendered inside mobile cards
    expect(mobileContainer).toHaveTextContent('TKT-20260913-0001');
    expect(mobileContainer).toHaveTextContent('Printer not working on floor 3');
    expect(mobileContainer).toHaveTextContent('IT Staff A');
    expect(mobileContainer).toHaveTextContent('TKT-20260913-0002');
    expect(mobileContainer).toHaveTextContent('Unassigned');
  });

  it('clicking mobile ticket card triggers navigation to detail page', async () => {
    renderQueue();

    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260913-0001')[0]).toBeInTheDocument();
    });

    const mobileContainer = document.getElementById('queue-list-mobile');
    const firstCard = mobileContainer?.firstElementChild as HTMLElement;
    expect(firstCard).toBeInTheDocument();

    fireEvent.click(firstCard);
    expect(mockNavigate).toHaveBeenCalledWith('/staff/tickets/1');
  });
});

// ---------------------------------------------------------------------------
// UI-12: Advanced API Error handling & Recovery
// ---------------------------------------------------------------------------
describe('UI-12 — Advanced API Error handling & Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('network exception (fetch reject) displays error banner without crashing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network connection refused'));
    renderQueue();

    await waitFor(() => {
      expect(
        screen.getByText(/unable to load ticket queue\. please try again\./i)
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('Retry button recovers and displays tickets once API becomes available', async () => {
    // 1. Initial failure
    global.fetch = vi.fn().mockRejectedValue(new Error('Server unavailable'));
    renderQueue();

    await waitFor(() => {
      expect(screen.getByText(/unable to load ticket queue/i)).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();

    // 2. API recovers
    mockFetchSuccess();

    // 3. User clicks Retry
    fireEvent.click(retryBtn);

    // 4. Ticket list rendered and error cleared
    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260913-0001')[0]).toBeInTheDocument();
      expect(screen.queryByText(/unable to load ticket queue/i)).not.toBeInTheDocument();
    });
  });

  it('malformed response (empty object) defaults gracefully without error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    renderQueue();

    await waitFor(() => {
      expect(screen.getByText('No tickets in the queue')).toBeInTheDocument();
    });
    expect(document.getElementById('queue-empty-state')).toBeInTheDocument();
  });
});

