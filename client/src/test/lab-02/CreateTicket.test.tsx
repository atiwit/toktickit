import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateTicket from '../../pages/CreateTicket';
import { RequesterContext } from '../../context/RequesterContext';

// ─── Shared mock data ────────────────────────────────────────

const MOCK_REQUESTER = { id: 1, name: 'Alice', email: 'alice@example.com' };

const MOCK_CATEGORIES = [
  { id: 1, name: 'Account and Access' },
  { id: 2, name: 'Hardware' },
];

const MOCK_SYSTEMS = [
  { id: 1, name: 'Email' },
  { id: 3, name: 'VPN' },
];

const MOCK_CREATED_TICKET = {
  id: 1,
  ticketNumber: 'TKT-20260825-0001',
  status: 'NEW',
  requestedPriority: 'MEDIUM',
  summary: 'Cannot log in to VPN',
  description: 'Full details here.',
  createdAt: '2026-08-25T07:00:00.000Z',
  category: { id: 1, name: 'Account and Access' },
  relatedSystem: { id: 3, name: 'VPN' },
  requester: { id: 1, name: 'Alice' },
};

// ─── Wrapper — provides RequesterContext ─────────────────────

const renderWithRequester = (requester = MOCK_REQUESTER) => {
  const contextValue = {
    selectedRequester: requester,
    changeRequester: vi.fn(),
  };
  return render(
    <RequesterContext.Provider value={contextValue}>
      <CreateTicket />
    </RequesterContext.Provider>
  );
};


beforeEach(() => {
  vi.restoreAllMocks();

  vi.spyOn(global, 'fetch').mockImplementation((url) => {
    const urlStr = String(url);
    if (urlStr.includes('/api/categories')) {
      return Promise.resolve(
        new Response(JSON.stringify(MOCK_CATEGORIES), { status: 200 })
      );
    }
    if (urlStr.includes('/api/related-systems')) {
      return Promise.resolve(
        new Response(JSON.stringify(MOCK_SYSTEMS), { status: 200 })
      );
    }
    return Promise.reject(new Error(`Unexpected fetch: ${urlStr}`));
  });
});


describe('UI-02 — Empty submit shows field-level error messages', () => {
  it('renders the form after reference data loads', async () => {
    renderWithRequester();
    // Form renders once loading finishes
    expect(await screen.findByRole('heading', { name: /create new ticket/i })).toBeInTheDocument();
  });

  it('shows category error when form submitted empty', async () => {
    renderWithRequester();
    await screen.findByRole('heading', { name: /create new ticket/i });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/category is required/i)).toBeInTheDocument();
    });
  });

  it('shows related system error when form submitted empty', async () => {
    renderWithRequester();
    await screen.findByRole('heading', { name: /create new ticket/i });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/related system is required/i)).toBeInTheDocument();
    });
  });

  it('shows priority error when form submitted empty', async () => {
    renderWithRequester();
    await screen.findByRole('heading', { name: /create new ticket/i });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/priority is required/i)).toBeInTheDocument();
    });
  });

  it('shows summary error when form submitted empty', async () => {
    renderWithRequester();
    await screen.findByRole('heading', { name: /create new ticket/i });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/summary is required/i)).toBeInTheDocument();
    });
  });

  it('shows description error when form submitted empty', async () => {
    renderWithRequester();
    await screen.findByRole('heading', { name: /create new ticket/i });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });
  });

  it('does NOT call fetch for POST /api/tickets when validation fails', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    renderWithRequester();
    await screen.findByRole('heading', { name: /create new ticket/i });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/summary is required/i)).toBeInTheDocument();
    });

    const postCalls = fetchSpy.mock.calls.filter(([url, opts]) =>
      String(url).includes('/api/tickets') && (opts as RequestInit)?.method === 'POST'
    );
    expect(postCalls).toHaveLength(0);
  });
});


describe('UI-03 — Busy state while submitting', () => {
  it('shows "Submitting…" text while awaiting response', async () => {
    // Make POST hang indefinitely so we can observe busy state
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/categories')) {
        return Promise.resolve(new Response(JSON.stringify(MOCK_CATEGORIES), { status: 200 }));
      }
      if (urlStr.includes('/api/related-systems')) {
        return Promise.resolve(new Response(JSON.stringify(MOCK_SYSTEMS), { status: 200 }));
      }
      if (urlStr.includes('/api/tickets')) {
        return new Promise(() => {}); // never resolves → loading forever
      }
      return Promise.reject(new Error(`Unexpected: ${urlStr}`));
    });

    renderWithRequester();
    await screen.findByRole('heading', { name: /create new ticket/i });

    // Fill all required fields
    fireEvent.change(screen.getByRole('combobox', { name: /category/i }), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: /related system/i }), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: /priority/i }), {
      target: { value: 'MEDIUM' },
    });
    fireEvent.change(screen.getByLabelText(/summary/i), {
      target: { value: 'Cannot log in to VPN' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Full details of the issue.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/submitting…/i)).toBeInTheDocument();
    });
  });

  it('submit button is disabled during submission', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/categories'))
        return Promise.resolve(new Response(JSON.stringify(MOCK_CATEGORIES), { status: 200 }));
      if (urlStr.includes('/api/related-systems'))
        return Promise.resolve(new Response(JSON.stringify(MOCK_SYSTEMS), { status: 200 }));
      return new Promise(() => {});
    });

    renderWithRequester();
    await screen.findByRole('heading', { name: /create new ticket/i });

    fireEvent.change(screen.getByRole('combobox', { name: /category/i }), { target: { value: '1' } });
    fireEvent.change(screen.getByRole('combobox', { name: /related system/i }), { target: { value: '3' } });
    fireEvent.change(screen.getByRole('combobox', { name: /priority/i }), { target: { value: 'MEDIUM' } });
    fireEvent.change(screen.getByLabelText(/summary/i), { target: { value: 'VPN issue' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Details here.' } });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /submitting/i });
      expect(btn).toBeDisabled();
    });
  });
});


describe('UI-03 — Success state displays ticket number', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation((url, opts) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/categories'))
        return Promise.resolve(new Response(JSON.stringify(MOCK_CATEGORIES), { status: 200 }));
      if (urlStr.includes('/api/related-systems'))
        return Promise.resolve(new Response(JSON.stringify(MOCK_SYSTEMS), { status: 200 }));
      if (urlStr.includes('/api/tickets') && (opts as RequestInit)?.method === 'POST')
        return Promise.resolve(new Response(JSON.stringify(MOCK_CREATED_TICKET), { status: 201 }));
      return Promise.reject(new Error(`Unexpected: ${urlStr}`));
    });
  });

  const fillAndSubmit = async () => {
    renderWithRequester();
    await screen.findByRole('heading', { name: /create new ticket/i });

    fireEvent.change(screen.getByRole('combobox', { name: /category/i }), { target: { value: '1' } });
    fireEvent.change(screen.getByRole('combobox', { name: /related system/i }), { target: { value: '3' } });
    fireEvent.change(screen.getByRole('combobox', { name: /priority/i }), { target: { value: 'MEDIUM' } });
    fireEvent.change(screen.getByLabelText(/summary/i), { target: { value: 'Cannot log in to VPN' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Full details of the issue.' } });
    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));
  };

  it('shows success heading after successful submission', async () => {
    await fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByText(/ticket submitted/i)).toBeInTheDocument();
    });
  });

  it('displays the generated ticket number', async () => {
    await fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByText('TKT-20260825-0001')).toBeInTheDocument();
    });
  });

  it('shows "Create Another Ticket" button in success state', async () => {
    await fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create another ticket/i })).toBeInTheDocument();
    });
  });

  it('"Create Another Ticket" resets back to the form', async () => {
    await fillAndSubmit();
    await waitFor(() => screen.getByRole('button', { name: /create another ticket/i }));
    fireEvent.click(screen.getByRole('button', { name: /create another ticket/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /create new ticket/i })).toBeInTheDocument();
    });
  });
});


describe('Safe error state — backend failure preserves form values', () => {
  it('shows error alert and does not reset form on network failure', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url, opts) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/categories'))
        return Promise.resolve(new Response(JSON.stringify(MOCK_CATEGORIES), { status: 200 }));
      if (urlStr.includes('/api/related-systems'))
        return Promise.resolve(new Response(JSON.stringify(MOCK_SYSTEMS), { status: 200 }));
      if (urlStr.includes('/api/tickets') && (opts as RequestInit)?.method === 'POST')
        return Promise.reject(new Error('Network error'));
      return Promise.reject(new Error(`Unexpected: ${urlStr}`));
    });

    renderWithRequester();
    await screen.findByRole('heading', { name: /create new ticket/i });

    const summaryField = screen.getByLabelText(/summary/i);
    fireEvent.change(screen.getByRole('combobox', { name: /category/i }), { target: { value: '1' } });
    fireEvent.change(screen.getByRole('combobox', { name: /related system/i }), { target: { value: '3' } });
    fireEvent.change(screen.getByRole('combobox', { name: /priority/i }), { target: { value: 'MEDIUM' } });
    fireEvent.change(summaryField, { target: { value: 'VPN issue' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Details.' } });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() => {
      // Error alert shown
      expect(screen.getByText(/unable to reach the server/i)).toBeInTheDocument();
    });

    // Form value preserved
    expect((summaryField as HTMLInputElement).value).toBe('VPN issue');
  });
});
