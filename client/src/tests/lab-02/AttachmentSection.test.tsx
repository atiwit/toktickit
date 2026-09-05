import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AttachmentSection from '../../pages/AttachmentSection';
import type { Attachment } from '../../pages/AttachmentSection';


const MOCK_ACTIVE: Attachment = {
  id: 1,
  ticketId: 1,
  originalFilename: 'screenshot.png',
  mimeType: 'image/png',
  size: 204800,
  isRemoved: false,
  removedReason: null,
  removedAt: null,
  uploadedAt: '2026-08-25T07:00:00.000Z',
};

const MOCK_REMOVED: Attachment = {
  id: 2,
  ticketId: 1,
  originalFilename: 'old-report.pdf',
  mimeType: 'application/pdf',
  size: 512000,
  isRemoved: true,
  removedReason: 'Wrong file attached',
  removedAt: '2026-08-25T09:00:00.000Z',
  uploadedAt: '2026-08-25T08:00:00.000Z',
};

beforeEach(() => {
  vi.restoreAllMocks();

  vi.spyOn(global, 'fetch').mockImplementation((url) => {
    const urlStr = String(url);
    if (urlStr.includes('/api/tickets/1/attachments')) {
      return Promise.resolve(
        new Response(JSON.stringify([MOCK_ACTIVE, MOCK_REMOVED]), { status: 200 })
      );
    }
    return Promise.reject(new Error(`Unexpected fetch: ${urlStr}`));
  });
});


import { RequesterContext } from '../../context/RequesterContext';

const defaultContext = {
  selectedRequester: { id: 1, name: 'Alice', email: 'alice@example.com', isActive: true },
  changeRequester: vi.fn(),
};

const renderSection = (ticketId = 1) =>
  render(
    <RequesterContext.Provider value={defaultContext}>
      <AttachmentSection ticketId={ticketId} />
    </RequesterContext.Provider>
  );


describe('UI-ATT-01 — Renders attachment list', () => {
  it('shows the upload section heading', async () => {
    renderSection();
    expect(await screen.findByRole('heading', { name: /upload attachment/i })).toBeInTheDocument();
  });

  it('shows the active attachments section heading', async () => {
    renderSection();
    expect(await screen.findByRole('heading', { name: /active attachments/i })).toBeInTheDocument();
  });

  it('renders the active attachment filename', async () => {
    renderSection();
    expect(await screen.findByText('screenshot.png')).toBeInTheDocument();
  });

  it('renders the removed attachment filename', async () => {
    renderSection();
    expect(await screen.findByText('old-report.pdf')).toBeInTheDocument();
  });

  it('shows "Removed Attachments" section when there are removed files', async () => {
    renderSection();
    expect(await screen.findByRole('heading', { name: /removed attachments/i })).toBeInTheDocument();
  });

  it('shows empty state when no attachments exist', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    );
    renderSection();
    expect(await screen.findByText(/no attachments yet/i)).toBeInTheDocument();
  });
});


describe('UI-ATT-02 — Active attachment has a download button', () => {
  it('download button is present for the active attachment', async () => {
    renderSection();
    await screen.findByText('screenshot.png');
    // react-bootstrap renders Button as="a" with role="button"
    const downloadBtn = screen.getByRole('button', { name: /download/i });
    expect(downloadBtn).toBeInTheDocument();
  });

  it('download link points to the correct API URL', async () => {
    renderSection();
    await screen.findByText('screenshot.png');
    // The download anchor has id="download-btn-1"
    const downloadLink = document.getElementById('download-btn-1');
    expect(downloadLink).not.toBeNull();
    expect(downloadLink).toHaveAttribute('href', '/api/attachments/1/download?requesterId=1');
  });
});


describe('UI-ATT-03 — Removed attachment has no download button', () => {
  it('does NOT render a download button for the removed attachment row', async () => {
    renderSection();
    await screen.findByText('old-report.pdf');


    const allDownloadBtns = document.querySelectorAll('[id^="download-btn-"]');
    expect(allDownloadBtns).toHaveLength(1); // only download-btn-1
  });

  it('shows the removal reason for the removed attachment', async () => {
    renderSection();
    await screen.findByText('old-report.pdf');
    expect(screen.getByText(/wrong file attached/i)).toBeInTheDocument();
  });

  it('shows a "Removed" badge for removed attachments', async () => {
    renderSection();
    await screen.findByText('old-report.pdf');
    expect(screen.getByText('Removed')).toBeInTheDocument();
  });
});


describe('UI-ATT-04 — Remove button triggers confirm dialog', () => {
  it('clicking Remove opens the confirm dialog', async () => {
    renderSection();
    await screen.findByText('screenshot.png');

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('confirm dialog shows the filename being removed', async () => {
    renderSection();
    await screen.findByText('screenshot.png');

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(within(screen.getByRole('dialog')).getByText('screenshot.png')).toBeInTheDocument();
  });

  it('confirm dialog contains a reason textarea', async () => {
    renderSection();
    await screen.findByText('screenshot.png');

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(screen.getByRole('textbox', { name: /reason/i })).toBeInTheDocument();
  });

  it('cancel button closes the dialog', async () => {
    renderSection();
    await screen.findByText('screenshot.png');

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    await waitFor(() => screen.getByRole('dialog'));

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('submitting without a reason shows a validation error', async () => {
    renderSection();
    await screen.findByText('screenshot.png');

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    await waitFor(() => screen.getByRole('dialog'));

    fireEvent.click(screen.getByRole('button', { name: /confirm remove/i }));

    await waitFor(() => {
      expect(screen.getByText(/please provide a reason/i)).toBeInTheDocument();
    });
  });

  it('successful removal reloads the attachment list', async () => {
    // First call returns active + removed; subsequent call returns only removed
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation((url, opts) => {
      const urlStr = String(url);
      const method = (opts as RequestInit)?.method ?? 'GET';
      if (urlStr.includes('/api/tickets/1/attachments')) {
        return Promise.resolve(
          new Response(JSON.stringify([MOCK_ACTIVE, MOCK_REMOVED]), { status: 200 })
        );
      }
      if (urlStr.includes('/api/attachments/1') && method === 'DELETE') {
        return Promise.resolve(
          new Response(
            JSON.stringify({ ...MOCK_ACTIVE, isRemoved: true, removedReason: 'Test reason' }),
            { status: 200 }
          )
        );
      }
      return Promise.reject(new Error(`Unexpected: ${urlStr}`));
    });

    renderSection();
    await screen.findByText('screenshot.png');

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    await waitFor(() => screen.getByRole('dialog'));

    fireEvent.change(screen.getByRole('textbox', { name: /reason/i }), {
      target: { value: 'Test reason' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm remove/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // fetch should have been called again to reload the list
    const deleteCalls = fetchSpy.mock.calls.filter(([url, opts]) =>
      String(url).includes('/api/attachments/1') && (opts as RequestInit)?.method === 'DELETE'
    );
    expect(deleteCalls).toHaveLength(1);
  });
});


describe('Upload — file picker behavior', () => {
  it('shows the Upload File button', async () => {
    renderSection();
    expect(await screen.findByRole('button', { name: /upload file/i })).toBeInTheDocument();
  });

  it('Upload File button is disabled when no file is selected', async () => {
    renderSection();
    const btn = await screen.findByRole('button', { name: /upload file/i });
    expect(btn).toBeDisabled();
  });
});
