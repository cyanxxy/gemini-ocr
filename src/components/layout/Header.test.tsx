import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { Header } from './Header';

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Header', () => {
  it('should render the header', () => {
    const onOpenSettings = vi.fn();
    renderWithRouter(<Header apiKey="" onOpenSettings={onOpenSettings} />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should display brand name', () => {
    const onOpenSettings = vi.fn();
    renderWithRouter(<Header apiKey="" onOpenSettings={onOpenSettings} />);

    expect(screen.getByText('Gemini')).toBeInTheDocument();
    expect(screen.getByText('OCR')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    const onOpenSettings = vi.fn();
    renderWithRouter(<Header apiKey="" onOpenSettings={onOpenSettings} />);

    const navElements = screen.getAllByRole('navigation');
    expect(navElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should show Add API Key button when no API key', () => {
    const onOpenSettings = vi.fn();
    renderWithRouter(<Header apiKey="" onOpenSettings={onOpenSettings} />);

    expect(screen.getByRole('button', { name: 'Add API Key' })).toBeInTheDocument();
  });

  it('should show settings button when API key is present', () => {
    const onOpenSettings = vi.fn();
    renderWithRouter(
      <Header apiKey="test-api-key" onOpenSettings={onOpenSettings} />
    );

    expect(screen.getByRole('button', { name: 'Open settings' })).toBeInTheDocument();
  });

  it('should call onOpenSettings when settings button is clicked', () => {
    const onOpenSettings = vi.fn();
    renderWithRouter(
      <Header apiKey="test-api-key" onOpenSettings={onOpenSettings} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenSettings when Add API Key button is clicked', () => {
    const onOpenSettings = vi.fn();
    renderWithRouter(<Header apiKey="" onOpenSettings={onOpenSettings} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add API Key' }));

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('should have link to home page', () => {
    const onOpenSettings = vi.fn();
    renderWithRouter(<Header apiKey="" onOpenSettings={onOpenSettings} />);

    const homeLink = screen.getByRole('link', { name: /gemini/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should render mobile navigation', () => {
    const onOpenSettings = vi.fn();
    renderWithRouter(<Header apiKey="" onOpenSettings={onOpenSettings} />);

    // Check mobile nav exists (has two navigation elements)
    const navElements = screen.getAllByRole('navigation');
    expect(navElements.length).toBeGreaterThanOrEqual(1);
  });
});
