import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingIndicator } from './LoadingIndicator';

describe('LoadingIndicator', () => {
  it('should render with default props', () => {
    render(<LoadingIndicator />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render custom text', () => {
    render(<LoadingIndicator text="Processing file..." />);

    expect(screen.getByText('Processing file...')).toBeInTheDocument();
  });

  it('should render small size', () => {
    const { container } = render(<LoadingIndicator size="sm" />);

    const spinner = container.querySelector('svg');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('should render medium size by default', () => {
    const { container } = render(<LoadingIndicator />);

    const spinner = container.querySelector('svg');
    expect(spinner).toHaveClass('w-6', 'h-6');
  });

  it('should render large size', () => {
    const { container } = render(<LoadingIndicator size="lg" />);

    const spinner = container.querySelector('svg');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('should render full page overlay when fullPage is true', () => {
    render(<LoadingIndicator fullPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <LoadingIndicator className="custom-loading" />
    );

    expect(container.firstChild).toHaveClass('custom-loading');
  });

  it('should have spinning animation', () => {
    const { container } = render(<LoadingIndicator />);

    const spinner = container.querySelector('svg');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should hide text when not provided', () => {
    const { container } = render(<LoadingIndicator text="" />);

    const spans = container.querySelectorAll('span');
    expect(spans.length).toBe(0);
  });

  it('should render full page with custom text', () => {
    render(<LoadingIndicator fullPage text="Analyzing document..." />);

    expect(screen.getByText('Analyzing document...')).toBeInTheDocument();
  });
});
