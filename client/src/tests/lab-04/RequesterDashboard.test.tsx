import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RequesterDashboard from '../../pages/RequesterDashboard';

// ---------------------------------------------------------------------------
// Mock react-router-dom
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
// Mock AuthContext
// ---------------------------------------------------------------------------
const mockRequesterUser = { id: 10, name: 'Alice Requester', role: 'REQUESTER', email: 'alice@test.com' };
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockRequesterUser,
  }),
}));

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
const mockRequesterDashboardData = {
  metrics: {
    myOpenTickets: 3,
    inProgress: 1,
    resolved: 4,
    closed: 12,
  },
  recentTickets: [
    {
      id: 10,
      ticketNumber: 'TICK-2026-00010',
      summary: 'Laptop battery drains quickly',
      status: 'IN_PROGRESS',
      requestedPriority: 'HIGH',
      updatedAt: '2026-10-27T09:14:00.000Z',
    },
    {
      id: 11,
      ticketNumber: 'TICK-2026-00011',
      summary: 'Unable to access shared drive',
      status: 'RESOLVED',
      requestedPriority: 'MEDIUM',
      updatedAt: '2026-10-26T16:00:00.000Z',
    },
  ],
  drillDownLinks: {
    myOpenTickets: '/tickets?status=open-group',
    inProgress: '/tickets?status=IN_PROGRESS',
    resolved: '/tickets?status=RESOLVED',
    closed: '/tickets?status=CLOSED',
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Requester Dashboard Component Tests (Lab 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UI-DSH-03: Render Requester Dashboard with cards & recent tickets (AC-06)', () => {
    it('renders greeting banner and all 4 metric cards with correct values and labels', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockRequesterDashboardData,
        }),
      } as Response);

      render(
        <BrowserRouter>
          <RequesterDashboard />
        </BrowserRouter>
      );

      // Greeting Banner
      expect(await screen.findByText(/Welcome, Alice Requester!/i)).toBeInTheDocument();
      expect(screen.getByText(/Here's the latest on your requests/i)).toBeInTheDocument();

      // Metric Cards
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /^My Open Tickets$/i })).toBeInTheDocument();

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /^In Progress$/i })).toBeInTheDocument();

      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /^Resolved$/i })).toBeInTheDocument();

      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /^Closed$/i })).toBeInTheDocument();

      // Recent Tickets Widget
      expect(screen.getByText('TICK-2026-00010')).toBeInTheDocument();
      expect(screen.getByText('Laptop battery drains quickly')).toBeInTheDocument();

      expect(screen.getByText('TICK-2026-00011')).toBeInTheDocument();
      expect(screen.getByText('Unable to access shared drive')).toBeInTheDocument();
    });

    it('renders empty state cleanly when recent tickets is empty and metrics are 0', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            metrics: { myOpenTickets: 0, inProgress: 0, resolved: 0, closed: 0 },
            recentTickets: [],
            drillDownLinks: mockRequesterDashboardData.drillDownLinks,
          },
        }),
      } as Response);

      render(
        <BrowserRouter>
          <RequesterDashboard />
        </BrowserRouter>
      );

      expect(await screen.findByText(/No recent tickets found/i)).toBeInTheDocument();
      expect(screen.getAllByText('0')).toHaveLength(4);
    });
  });

  describe('UI-DSH-04: Requester Dashboard drill-down navigation (AC-08)', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockRequesterDashboardData,
        }),
      } as Response);
    });

    it('navigates to /tickets?status=open-group when clicking My Open Tickets card', async () => {
      render(
        <BrowserRouter>
          <RequesterDashboard />
        </BrowserRouter>
      );

      const openTicketsCard = await screen.findByRole('button', { name: /My Open Tickets: 3/i });
      fireEvent.click(openTicketsCard);

      expect(mockNavigate).toHaveBeenCalledWith('/tickets?status=open-group');
    });

    it('navigates to /tickets?status=IN_PROGRESS when clicking In Progress card', async () => {
      render(
        <BrowserRouter>
          <RequesterDashboard />
        </BrowserRouter>
      );

      const inProgressCard = await screen.findByRole('button', { name: /In Progress: 1/i });
      fireEvent.click(inProgressCard);

      expect(mockNavigate).toHaveBeenCalledWith('/tickets?status=IN_PROGRESS');
    });

    it('navigates to /tickets?status=RESOLVED when clicking Resolved card', async () => {
      render(
        <BrowserRouter>
          <RequesterDashboard />
        </BrowserRouter>
      );

      const resolvedCard = await screen.findByRole('button', { name: /Resolved: 4/i });
      fireEvent.click(resolvedCard);

      expect(mockNavigate).toHaveBeenCalledWith('/tickets?status=RESOLVED');
    });

    it('navigates to /tickets?status=CLOSED when clicking Closed card', async () => {
      render(
        <BrowserRouter>
          <RequesterDashboard />
        </BrowserRouter>
      );

      const closedCard = await screen.findByRole('button', { name: /Closed: 12/i });
      fireEvent.click(closedCard);

      expect(mockNavigate).toHaveBeenCalledWith('/tickets?status=CLOSED');
    });

    it('navigates to ticket detail when clicking a recent ticket row', async () => {
      render(
        <BrowserRouter>
          <RequesterDashboard />
        </BrowserRouter>
      );

      const ticketItem = await screen.findByText('TICK-2026-00010');
      fireEvent.click(ticketItem);

      expect(mockNavigate).toHaveBeenCalledWith('/tickets/10');
    });

    it('navigates to /tickets when clicking View all in recent tickets widget', async () => {
      render(
        <BrowserRouter>
          <RequesterDashboard />
        </BrowserRouter>
      );

      const viewAllBtn = await screen.findByRole('button', { name: /^View all$/i });
      fireEvent.click(viewAllBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/tickets');
    });

    it('handles Quick Actions navigation (+ Create Ticket, View My Tickets)', async () => {
      render(
        <BrowserRouter>
          <RequesterDashboard />
        </BrowserRouter>
      );

      const createBtn = await screen.findByRole('button', { name: /\+ Create Ticket/i });
      fireEvent.click(createBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/create-ticket');

      const myTicketsBtn = screen.getByRole('button', { name: /View My Tickets/i });
      fireEvent.click(myTicketsBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/tickets');
    });

    it('refetches dashboard data when clicking Refresh button', async () => {
      render(
        <BrowserRouter>
          <RequesterDashboard />
        </BrowserRouter>
      );

      const refreshBtn = await screen.findByRole('button', { name: /Refresh Dashboard/i });
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});
