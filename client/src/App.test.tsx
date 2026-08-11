import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the TokTickIT heading', () => {
    render(<App />);
    expect(screen.getByText(/TokTickIT IT Service Desk/i)).toBeInTheDocument();
  });
});
