import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../../App';

describe('UI-03: API failure displays a useful error message', () => {
  it('shows an error message when the API call fails', async () => {
    // Mock fetch to simulate a network failure
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    render(<App />);
    fireEvent.click(screen.getByText('[ Check System ]'));

    await waitFor(() => {
      expect(
        screen.getByText(/Unable to connect to Tok TickIT API/i)
      ).toBeInTheDocument();
    });
  });
});
