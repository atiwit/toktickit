import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TicketDetailPage from '../../pages/TicketDetail';
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
  selectedRequester: { id: 1, name: 'Alice', email: 'alice@example.com' },
  changeRequester: vi.fn(),
};

const mockTicket = {
  id: 1,
  ticketNumber: 'TKT-20260825-0001',
  status: 'NEW',
  requestedPriority: 'HIGH',
  summary: 'Laptop screen flickering',
  description: 'The screen flickers when on battery power.',
  createdAt: '2026-08-25T10:00:00Z',
  updatedAt: '2026-08-25T11:00:00Z',
  category: { id: 1, name: 'Hardware' },
  relatedSystem: { id: 2, name: 'ERP System' },
  requester: { id: 1, name: 'Alice', email: 'alice@example.com' },
  attachments: [],
};

const activeAttachment = {
  id: 10,
  ticketId: 1,
  originalFilename: 'report.pdf',
  mimeType: 'application/pdf',
  size: 204800,
  isRemoved: false,
  removedReason: null,
  removedAt: null,
  uploadedAt: '2026-08-25T10:30:00Z',
};

const removedAttachment = {
  id: 11,
  ticketId: 1,
  originalFilename: 'old_screenshot.png',
  mimeType: 'image/png',
  size: 51200,
  isRemoved: true,
  removedReason: 'Wrong file uploaded',
  removedAt: '2026-08-25T11:00:00Z',
  uploadedAt: '2026-08-25T10:15:00Z',
};


const renderComponent = (context = defaultContext, ticketId = '1') =>
  render(
    <RequesterContext.Provider value={context}>
      <MemoryRouter initialEntries={[`/tickets/${ticketId}`]}>
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
        </Routes>
      </MemoryRouter>
    </RequesterContext.Provider>
  );

const makeFetchMock = (attachments: object[]) =>
  vi.fn().mockImplementation((url: string) => {
    // Must check /attachments BEFORE /api/tickets/ to avoid false match
    if (String(url).includes('/attachments')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(attachments) });
    }
    if (String(url).includes('/api/tickets/')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTicket) });
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });


describe('TicketDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Safe default — individual tests override below
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch not configured'));
  });

  it('All ticket fields are read-only (displayed as text, not inputs)', async () => {
    global.fetch = makeFetchMock([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260825-0001').length).toBeGreaterThan(0);
    });

    // Verify key fields rendered as plain text
    expect(screen.getByText('Laptop screen flickering')).toBeInTheDocument();
    expect(screen.getByText('The screen flickers when on battery power.')).toBeInTheDocument();
    expect(screen.getByText('Hardware')).toBeInTheDocument();
    expect(screen.getByText('ERP System')).toBeInTheDocument();

    // No editable text inputs (file input from AttachmentSection is excluded)
    const textInputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea');
    expect(textInputs.length).toBe(0);
  });

  it('Active attachment: download button present', async () => {
    global.fetch = makeFetchMock([activeAttachment]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('TKT-20260825-0001').length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(screen.getByText('Download')).toBeInTheDocument();
    });
  });

  it('Removed attachment: no download button, metadata shown', async () => {
    // Render AttachmentSection directly so we don't depend on two sequential fetches
    const { render: localRender } = await import('@testing-library/react');
    const { default: AttachmentSection } = await import('../../pages/AttachmentSection');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([removedAttachment]),
    });

    localRender(
      <RequesterContext.Provider value={defaultContext}>
        <AttachmentSection ticketId={1} />
      </RequesterContext.Provider>
    );

    const reasonEl = await screen.findByText(/Wrong file uploaded/i, { exact: false }, { timeout: 5000 });
    expect(reasonEl).toBeInTheDocument();
    expect(screen.queryByText('Download')).toBeNull();
  });

  it('Wrong-requester state: shows 403 error, no ticket data exposed', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 403,
      ok: false,
      json: () => Promise.resolve({ error: 'Forbidden' }),
    });

    renderComponent();

    await waitFor(() => {
      const forbidden = document.getElementById('ticket-detail-forbidden');
      expect(forbidden).toBeInTheDocument();
    });

    expect(screen.queryByText('Laptop screen flickering')).toBeNull();
    expect(screen.queryByText('TKT-20260825-0001')).toBeNull();
  });
});
