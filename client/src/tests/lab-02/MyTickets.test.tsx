import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import MyTickets from '../../pages/MyTickets';
import { RequesterContext } from '../../context/RequesterContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const defaultContext = {
  selectedRequester: { id: 1, name: 'Alice', email: 'alice@example.com', isActive: true },
  changeRequester: vi.fn(),
};

const mockTickets = [
  {
    id: 1,
    ticketNumber: 'TKT-20260825-0001',
    summary: 'Laptop issue',
    status: 'NEW',
    requestedPriority: 'HIGH',
    createdAt: '2026-08-25T10:00:00Z',
    category: { id: 1, name: 'Hardware' },
    requester: { id: 1, name: 'Alice' },
  }
];

const renderComponent = (context = defaultContext) => {
  return render(
    <RequesterContext.Provider value={context}>
      <BrowserRouter>
        <MyTickets />
      </BrowserRouter>
    </RequesterContext.Provider>
  );
};

describe('MyTickets Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, name: 'Hardware' }])
        });
      }
      if (url.includes('/api/tickets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: mockTickets,
            meta: { totalCount: 1, totalPages: 1, currentPage: 1 }
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('Renders ticket list', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260825-0001')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Laptop issue')[0]).toBeInTheDocument();
    });
  });

  it('Empty state when no tickets', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/tickets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [], meta: { totalCount: 0, totalPages: 0, currentPage: 1 } })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("You haven't submitted any tickets yet.")).toBeInTheDocument();
    });
  });

  it('No-results state after search', async () => {
    renderComponent();
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260825-0001')[0]).toBeInTheDocument();
    });

    // Mock fetch for no results
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/tickets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [], meta: { totalCount: 0, totalPages: 0, currentPage: 1 } })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const searchInput = screen.getByPlaceholderText('Search by ticket number or summary...');
    fireEvent.change(searchInput, { target: { value: 'Something' } });

    await waitFor(() => {
      expect(screen.getByText('Try adjusting your search or filters.')).toBeInTheDocument();
    });
  });

  it('Requester switch triggers list reload', async () => {
    const { rerender } = renderComponent();
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/tickets'), expect.any(Object));
    });
    
    const count = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    const newContext = {
      selectedRequester: { id: 2, name: 'Bob', email: 'bob@example.com', isActive: true },
      changeRequester: vi.fn(),
    };

    rerender(
      <RequesterContext.Provider value={newContext}>
        <BrowserRouter>
          <MyTickets />
        </BrowserRouter>
      </RequesterContext.Provider>
    );

    await waitFor(() => {
      expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(count);
    });
  });
});
