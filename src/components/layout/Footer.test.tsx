import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('should render the footer', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should display brand name', () => {
    render(<Footer />);

    // The footer contains "Gemini OCR" - use getAllByText for multiple matches
    const geminiElements = screen.getAllByText(/Gemini/);
    expect(geminiElements.length).toBeGreaterThan(0);
  });

  it('should display Gemini 3 badge', () => {
    render(<Footer />);

    expect(screen.getByText('Gemini 3')).toBeInTheDocument();
  });

  it('should display copyright text', () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });

  it('should have GitHub link', () => {
    render(<Footer />);

    const githubLink = screen.getByRole('link', { name: /github/i });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/cyanxxy');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should have LinkedIn link', () => {
    render(<Footer />);

    const linkedinLink = screen.getByRole('link', { name: /linkedin/i });
    expect(linkedinLink).toHaveAttribute('href', expect.stringContaining('linkedin.com'));
    expect(linkedinLink).toHaveAttribute('target', '_blank');
  });

  it('should have Email link', () => {
    render(<Footer />);

    const emailLink = screen.getByRole('link', { name: /email/i });
    expect(emailLink).toHaveAttribute('href', expect.stringContaining('mailto:'));
  });

  it('should indicate external links', () => {
    render(<Footer />);

    const githubLink = screen.getByRole('link', { name: /github.*opens in new tab/i });
    expect(githubLink).toBeInTheDocument();
  });
});
