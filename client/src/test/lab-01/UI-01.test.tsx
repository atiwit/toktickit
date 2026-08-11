import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App';

describe('UI-01: TokTickIT heading renders', () => {
  it('renders TokTickIT IT Service Desk heading', () => {
    render(<App />);
    expect(screen.getByText(/TokTickIT IT Service Desk/i)).toBeInTheDocument();
  });
});
