import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApiKeyBanner } from './ApiKeyBanner';

describe('ApiKeyBanner', () => {
  it('should render the banner', () => {
    const onOpenSettings = vi.fn();
    const onClose = vi.fn();

    render(<ApiKeyBanner onOpenSettings={onOpenSettings} onClose={onClose} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should display API key required message', () => {
    const onOpenSettings = vi.fn();
    const onClose = vi.fn();

    render(<ApiKeyBanner onOpenSettings={onOpenSettings} onClose={onClose} />);

    expect(screen.getByText('API Key Required')).toBeInTheDocument();
    expect(
      screen.getByText('Add your Gemini API key to start using the OCR tool')
    ).toBeInTheDocument();
  });

  it('should call onOpenSettings when Add API Key button is clicked', () => {
    const onOpenSettings = vi.fn();
    const onClose = vi.fn();

    render(<ApiKeyBanner onOpenSettings={onOpenSettings} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add API Key' }));

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when dismiss button is clicked', () => {
    const onOpenSettings = vi.fn();
    const onClose = vi.fn();

    render(<ApiKeyBanner onOpenSettings={onOpenSettings} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss banner' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should have alert role for accessibility', () => {
    const onOpenSettings = vi.fn();
    const onClose = vi.fn();

    render(<ApiKeyBanner onOpenSettings={onOpenSettings} onClose={onClose} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });
});
