import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the Vite and React logos', () => {
    render(<App />);
    expect(screen.getByAltText('Vite logo')).toBeDefined();
    expect(screen.getByAltText('React logo')).toBeDefined();
  });
});
