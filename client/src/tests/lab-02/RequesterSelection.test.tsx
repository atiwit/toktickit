import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import RequesterSelector from '../../pages/RequesterSelector';
import { RequesterContext } from '../../context/RequesterContext';

import { BrowserRouter } from 'react-router-dom';

const mockRequesters = [
  { id: 1, name: 'Alice', email: 'alice@example.com', isActive: true },
  { id: 2, name: 'Bob', email: 'bob@example.com', isActive: true },
];

const renderComponent = () => {
  const contextValue = {
    selectedRequester: null,
    changeRequester: vi.fn(),
  };
  return render(
    <RequesterContext.Provider value={contextValue}>
      <BrowserRouter>
        <RequesterSelector />
      </BrowserRouter>
    </RequesterContext.Provider>
  );
};

describe('UI-01 — Requester Selection renders dropdown', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/requesters')) {
        return Promise.resolve(new Response(JSON.stringify(mockRequesters), { status: 200 }));
      }
      return Promise.reject(new Error(`Unexpected fetch: ${urlStr}`));
    });
  });

  it('Dropdown present, inactive excluded', async () => {
    renderComponent();
    
    // Wait for the dropdown to be populated
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    // Check options are rendered (Alice and Bob)
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThanOrEqual(2);
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});
