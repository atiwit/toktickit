import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StaffDashboard from '../../pages/StaffDashboard';

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
const mockStaffUser = { id: 2, name: 'IT Staff Hero', role: 'IT_STAFF', email: 'hero@test.com' };
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockStaffUser,
  }),
}));

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
const mockStaffDashboardData = {
  metrics: {
    new: 14,
    open: 23,
    inProgress: 18,
    waitingForRequester: 7,
    myAssigned: 16,
  },
  recentTickets: [
    {
      id: 34,
      ticketNumber: 'TICK-2026-00034',
      summary: 'Network switch failure floor 3',
      status: 'IN_PROGRESS',
      itPriority: 'CRITICAL',
      ownerName: 'Jane Technician',
      updatedAt: '2026-10-27T09:16:00.000Z',
    },
    {
      id: 35,
      ticketNumber: 'TICK-2026-00035',
      summary: 'VPN client auth expired',
      status: 'NEW',
      itPriority: 'HIGH',
      ownerName: null,
      updatedAt: '2026-10-27T08:30:00.000Z',
    },
  ],
  drillDownLinks: {
    new: '/staff/tickets?status=NEW',
    open: '/staff/tickets?status=OPEN',
    inProgress: '/staff/tickets?status=IN_PROGRESS',
    waitingForRequester: '/staff/tickets?status=WAITING_FOR_REQUESTER',
    myAssigned: '/staff/tickets?owner=me&status=open-group',
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('IT Staff Dashboard Component Tests (Lab 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UI-DSH-01: Render IT Staff Dashboard with metrics cards (AC-07)', () => {
    it('renders greeting banner and all 5 operational metric cards with correct values and labels', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockStaffDashboardData,
        }),
      } as Response);

      render(
        <BrowserRouter>
          <StaffDashboard />
        </BrowserRouter>
      );

      // Greeting Banner
      expect(await screen.findByText(/Welcome back, IT Staff Hero!/i)).toBeInTheDocument();
      expect(screen.getByText(/Here's what's happening with your queue today/i)).toBeInTheDocument();

      // Metric Cards Values & Labels
      expect(screen.getByText('14')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /^New$/i })).toBeInTheDocument();

      expect(screen.getByText('23')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /^Open$/i })).toBeInTheDocument();

      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /^In Progress$/i })).toBeInTheDocument();

      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /^Waiting for Requester$/i })).toBeInTheDocument();

      expect(screen.getByText('16')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /^My Assigned$/i })).toBeInTheDocument();

      // Recent Tickets Widget
      expect(screen.getByText('TICK-2026-00034')).toBeInTheDocument();
      expect(screen.getByText('Network switch failure floor 3')).toBeInTheDocument();
      expect(screen.getByText('👤 Jane Technician')).toBeInTheDocument();

      expect(screen.getByText('TICK-2026-00035')).toBeInTheDocument();
      expect(screen.getByText('VPN client auth expired')).toBeInTheDocument();
      expect(screen.getByText('👤 Unassigned')).toBeInTheDocument();
    });

    it('renders empty state cleanly when recent tickets is empty and metrics are 0', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            metrics: { new: 0, open: 0, inProgress: 0, waitingForRequester: 0, myAssigned: 0 },
            recentTickets: [],
            drillDownLinks: mockStaffDashboardData.drillDownLinks,
          },
        }),
      } as Response);

      render(
        <BrowserRouter>
          <StaffDashboard />
        </BrowserRouter>
      );

      expect(await screen.findByText(/No recent tickets found/i)).toBeInTheDocument();
      expect(screen.getAllByText('0')).toHaveLength(5);
    });
  });

  describe('UI-DSH-02: IT Staff Dashboard metric cards click drill-down (AC-08)', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockStaffDashboardData,
        }),
      } as Response);
    });

    it('navigates to /staff/tickets?status=NEW when clicking New card', async () => {
      render(
        <BrowserRouter>
          <StaffDashboard />
        </BrowserRouter>
      );

      const newCard = await screen.findByRole('button', { name: /New: 14/i });
      fireEvent.click(newCard);

      expect(mockNavigate).toHaveBeenCalledWith('/staff/tickets?status=NEW');
    });

    it('navigates to /staff/tickets?status=OPEN when clicking Open card', async () => {
      render(
        <BrowserRouter>
          <StaffDashboard />
        </BrowserRouter>
      );

      const openCard = await screen.findByRole('button', { name: /Open: 23/i });
      fireEvent.click(openCard);

      expect(mockNavigate).toHaveBeenCalledWith('/staff/tickets?status=OPEN');
    });

    it('navigates to /staff/tickets?status=IN_PROGRESS when clicking In Progress card', async () => {
      render(
        <BrowserRouter>
          <StaffDashboard />
        </BrowserRouter>
      );

      const inProgressCard = await screen.findByRole('button', { name: /In Progress: 18/i });
      fireEvent.click(inProgressCard);

      expect(mockNavigate).toHaveBeenCalledWith('/staff/tickets?status=IN_PROGRESS');
    });

    it('navigates to /staff/tickets?status=WAITING_FOR_REQUESTER when clicking Waiting for Requester card', async () => {
      render(
        <BrowserRouter>
          <StaffDashboard />
        </BrowserRouter>
      );

      const waitingCard = await screen.findByRole('button', { name: /Waiting for Requester: 7/i });
      fireEvent.click(waitingCard);

      expect(mockNavigate).toHaveBeenCalledWith('/staff/tickets?status=WAITING_FOR_REQUESTER');
    });

    it('navigates to /staff/tickets?owner=me&status=open-group when clicking My Assigned card', async () => {
      render(
        <BrowserRouter>
          <StaffDashboard />
        </BrowserRouter>
      );

      const myAssignedCard = await screen.findByRole('button', { name: /My Assigned: 16/i });
      fireEvent.click(myAssignedCard);

      expect(mockNavigate).toHaveBeenCalledWith('/staff/tickets?owner=me&status=open-group');
    });

    it('navigates to ticket detail when clicking a recent ticket row', async () => {
      render(
        <BrowserRouter>
          <StaffDashboard />
        </BrowserRouter>
      );

      const ticketItem = await screen.findByText('TICK-2026-00034');
      fireEvent.click(ticketItem);

      expect(mockNavigate).toHaveBeenCalledWith('/staff/tickets/34');
    });

    it('navigates to queue when clicking View all in recent tickets widget', async () => {
      render(
        <BrowserRouter>
          <StaffDashboard />
        </BrowserRouter>
      );

      const viewAllBtn = await screen.findByRole('button', { name: /View all/i });
      fireEvent.click(viewAllBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/staff/tickets');
    });

    it('handles Quick Actions navigation (+ Create Ticket, Search Tickets, My Queue)', async () => {
      render(
        <BrowserRouter>
          <StaffDashboard />
        </BrowserRouter>
      );

      const createBtn = await screen.findByRole('button', { name: /\+ Create Ticket/i });
      fireEvent.click(createBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/create-ticket');

      const searchBtn = screen.getByRole('button', { name: /🔍 Search Tickets/i });
      fireEvent.click(searchBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/staff/tickets');

      const queueBtn = screen.getByRole('button', { name: /📋 My Queue/i });
      fireEvent.click(queueBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/staff/tickets?owner=me&status=open-group');
    });

    it('refetches dashboard data when clicking Refresh Data button', async () => {
      render(
        <BrowserRouter>
          <StaffDashboard />
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
