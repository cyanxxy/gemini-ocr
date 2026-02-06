import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Upload, Download } from 'lucide-react';
import { Button } from './Button';
import { theme } from '../../design/theme';

describe('Button', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should not trigger click when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    );

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render with primary variant by default', () => {
    render(<Button>Primary Button</Button>);

    const button = screen.getByRole('button');
    // Editorial design uses stone palette
    expect(button).toHaveClass('bg-stone-900');
  });

  it('should render with secondary variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-white');
  });

  it('should render with danger variant', () => {
    render(<Button variant="danger">Danger Button</Button>);

    const button = screen.getByRole('button');
    // Danger uses vermillion color
    expect(button.className).toContain('bg-[#E34234]');
  });

  it('should render with small size', () => {
    render(<Button size="sm">Small Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('should render with medium size by default', () => {
    render(<Button>Medium Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('should render with large size', () => {
    render(<Button size="lg">Large Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('should render full width when fullWidth prop is true', () => {
    render(<Button fullWidth>Full Width Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });

  it('should render left icon', () => {
    render(<Button leftIcon={Upload}>Upload File</Button>);

    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('Upload File')).toBeInTheDocument();
  });

  it('should render right icon', () => {
    render(<Button rightIcon={Download}>Download File</Button>);

    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('Download File')).toBeInTheDocument();
  });

  it('should render both left and right icons', () => {
    render(
      <Button leftIcon={Upload} rightIcon={Download}>
        Process File
      </Button>
    );

    const button = screen.getByRole('button');
    const svgElements = button.querySelectorAll('svg');
    expect(svgElements).toHaveLength(2);
  });

  it('should show loading state', () => {
    render(<Button loading>Loading Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    const spinner = button.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should hide children when loading', () => {
    render(<Button loading>Button Text</Button>);

    expect(screen.queryByText('Button Text')).not.toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should not show left/right icons when loading', () => {
    render(
      <Button loading leftIcon={Upload} rightIcon={Download}>
        Loading Button
      </Button>
    );

    const button = screen.getByRole('button');
    const svgElements = button.querySelectorAll('svg');
    expect(svgElements).toHaveLength(1);
    expect(svgElements[0]).toHaveClass('animate-spin');
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should forward HTML button attributes', () => {
    render(
      <Button
        id="test-button"
        type="submit"
        name="submit-btn"
        data-testid="custom-button"
      >
        Submit
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('id', 'test-button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('name', 'submit-btn');
    expect(button).toHaveAttribute('data-testid', 'custom-button');
  });

  it('should have proper accessibility attributes', () => {
    render(
      <Button disabled loading aria-label="Loading button">
        Loading
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Loading button');
    expect(button).toHaveAttribute('disabled');
  });

  it('should work with refs', () => {
    const ref = { current: null } as { current: HTMLButtonElement | null };

    render(<Button ref={ref}>Button with ref</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  describe('variant styling', () => {
    it('should apply correct hover states for primary variant', () => {
      render(<Button variant="primary">Primary</Button>);

      const button = screen.getByRole('button');
      // Editorial design uses stone palette hover
      expect(button).toHaveClass('hover:bg-stone-800');
    });

    it('should apply correct hover states for secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      // Editorial design uses stone palette hover
      expect(button).toHaveClass('hover:bg-stone-50');
    });

    it('should apply correct disabled styles', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(...theme.utils.disabled.split(' '));
    });
  });

  describe('loading state combinations', () => {
    it('should disable button when loading even if not explicitly disabled', () => {
      render(<Button loading>Loading</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should prioritize loading state over regular state', () => {
      const handleClick = vi.fn();
      render(
        <Button loading onClick={handleClick}>
          Loading Button
        </Button>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });
  });
});
