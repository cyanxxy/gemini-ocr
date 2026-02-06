import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('should render toggle switch', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} />);

    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should display label when provided', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Enable feature" />);

    expect(screen.getByText('Enable feature')).toBeInTheDocument();
  });

  it('should display description when provided', () => {
    const onChange = vi.fn();
    render(
      <Toggle
        checked={false}
        onChange={onChange}
        label="Feature"
        description="This enables the feature"
      />
    );

    expect(screen.getByText('This enables the feature')).toBeInTheDocument();
  });

  it('should toggle checked state on click', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole('switch'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('should toggle to false when clicked while checked', () => {
    const onChange = vi.fn();
    render(<Toggle checked={true} onChange={onChange} />);

    fireEvent.click(screen.getByRole('switch'));

    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('should not toggle when disabled', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} disabled />);

    fireEvent.click(screen.getByRole('switch'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should have correct aria-checked attribute', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Toggle checked={false} onChange={onChange} />);

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');

    rerender(<Toggle checked={true} onChange={onChange} />);

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('should apply custom className', () => {
    const onChange = vi.fn();
    render(
      <Toggle checked={false} onChange={onChange} className="custom-class" />
    );

    expect(screen.getByRole('switch').parentElement?.parentElement).toHaveClass(
      'custom-class'
    );
  });

  it('should render small size', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} size="sm" />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveClass('h-5', 'w-9');
  });

  it('should render medium size by default', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveClass('h-6', 'w-11');
  });

  it('should render large size', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} size="lg" />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveClass('h-7', 'w-14');
  });

  it('should use label as aria-label', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Test Label" />);

    expect(screen.getByRole('switch')).toHaveAttribute(
      'aria-label',
      'Test Label'
    );
  });

  it('should use default aria-label when no label provided', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} />);

    expect(screen.getByRole('switch')).toHaveAttribute(
      'aria-label',
      'Toggle switch'
    );
  });

  it('should be disabled when disabled prop is true', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} disabled />);

    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
