import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from './Alert';
import { theme } from '../../design/theme';

describe('Alert', () => {
  it('should render alert with children', () => {
    render(<Alert>Alert message</Alert>);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Alert message')).toBeInTheDocument();
  });

  it('should render with info variant by default', () => {
    render(<Alert>Info alert</Alert>);

    const alert = screen.getByRole('alert');
    // Editorial design uses stone palette for info variant
    expect(alert.className).toContain('bg-stone-50/80');
    expect(alert.className).toContain('border-stone-200');
  });

  it('should render with success variant', () => {
    render(<Alert variant="success">Success message</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-emerald-50/80');
    expect(alert.className).toContain('border-emerald-100');
  });

  it('should render with warning variant', () => {
    render(<Alert variant="warning">Warning message</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-amber-50/80');
    expect(alert.className).toContain('border-amber-100');
  });

  it('should render with error variant', () => {
    render(<Alert variant="error">Error message</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-rose-50/80');
    expect(alert.className).toContain('border-rose-100');
  });

  it('should apply base alert styles', () => {
    render(<Alert>Base styles</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('p-4');
    expect(alert).toHaveClass('rounded-2xl');
    expect(alert).toHaveClass('border');
    expect(alert.className).toContain(theme.animation.fadeIn);
  });

  it('should apply custom className', () => {
    render(<Alert className="custom-alert">Custom alert</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('custom-alert');
  });

  it('should render with title and description', () => {
    render(<Alert title="Alert Title">This is the alert description</Alert>);

    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('This is the alert description')).toBeInTheDocument();
  });

  it('should render only children when no title provided', () => {
    render(<Alert>Just the message</Alert>);

    expect(screen.getByText('Just the message')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render with icon for each variant', () => {
    const { rerender } = render(<Alert variant="info">Info</Alert>);
    expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument();

    rerender(<Alert variant="success">Success</Alert>);
    expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument();

    rerender(<Alert variant="warning">Warning</Alert>);
    expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument();

    rerender(<Alert variant="error">Error</Alert>);
    expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument();
  });

  it('should render complex content', () => {
    render(
      <Alert title="Complex Alert">
        <p>This is a paragraph</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </Alert>
    );

    expect(screen.getByText('Complex Alert')).toBeInTheDocument();
    expect(screen.getByText('This is a paragraph')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('should handle empty children gracefully', () => {
    render(<Alert title="Empty Content"></Alert>);

    expect(screen.getByText('Empty Content')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render with long content', () => {
    const longText =
      'This is a very long alert message that might wrap to multiple lines and should still be displayed correctly in the alert component with proper styling and spacing.';

    render(<Alert>{longText}</Alert>);

    expect(screen.getByText(longText)).toBeInTheDocument();
  });
});
