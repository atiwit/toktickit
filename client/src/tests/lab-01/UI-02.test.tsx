import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../../App';

describe('UI-02: Loading state changes to category list', () => {
  it('shows loading then displays the category list on success', async () => {
    // Mock fetch to simulate delayed success responses
    global.fetch = vi.fn((url: string | Request | URL) => {
      const urlStr = url.toString();
      return new Promise((resolve) => {
        setTimeout(() => {
          if (urlStr.includes('health')) {
            resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) } as Response);
          } else {
            resolve({
              ok: true,
              json: () =>
                Promise.resolve([
                  { id: 1, name: 'Account and Access' },
                  { id: 2, name: 'Hardware' },
                  { id: 3, name: 'Software' },
                  { id: 4, name: 'Network' },
                ]),
            } as Response);
          }
        }, 50);
      });
    });

    render(<App />);
    fireEvent.click(screen.getByText('[ Check System ]'));

    // Loading state should appear
    expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();

    // After fetch resolves, categories should appear
    await waitFor(() => {
      expect(screen.getByText('Account and Access')).toBeInTheDocument();
    });

    // Loading should be gone
    expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
  });
});
