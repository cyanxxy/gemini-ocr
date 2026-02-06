import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileText } from 'lucide-react';
import { Card } from './Card';

describe('Card', () => {
  it('should render children content', () => {
    render(<Card>Card content</Card>);

    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should render with title', () => {
    render(<Card title="Card Title">Content</Card>);

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Card Title'
    );
  });

  it('should render with description', () => {
    render(
      <Card title="Title" description="Card description">
        Content
      </Card>
    );

    expect(screen.getByText('Card description')).toBeInTheDocument();
  });

  it('should render with icon component', () => {
    render(
      <Card title="Title" icon={FileText}>
        Content
      </Card>
    );

    // Icon should be rendered in a container
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('should render with footer', () => {
    render(
      <Card title="Title" footer={<button>Action</button>}>
        Content
      </Card>
    );

    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Card className="custom-card">Content</Card>
    );

    expect(container.firstChild).toHaveClass('custom-card');
  });

  it('should render subtle variant', () => {
    const { container } = render(<Card subtle>Content</Card>);

    expect(container.firstChild).toHaveClass('bg-stone-50');
  });

  it('should render bordered variant', () => {
    const { container } = render(<Card variant="bordered">Content</Card>);

    expect(container.firstChild).toHaveClass('border-2');
  });

  it('should render compact variant', () => {
    const { container } = render(
      <Card title="Title" compact>
        Content
      </Card>
    );

    // Compact variant uses smaller padding
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should remove padding when noPadding is true', () => {
    const { container } = render(<Card noPadding>Content</Card>);

    // Content area should not have padding classes
    const contentDiv = container.querySelector('.min-w-0');
    expect(contentDiv).not.toHaveClass('p-4');
  });

  it('should apply custom headerClassName', () => {
    const { container } = render(
      <Card title="Title" headerClassName="custom-header">
        Content
      </Card>
    );

    const header = container.querySelector('.custom-header');
    expect(header).toBeInTheDocument();
  });

  it('should apply custom bodyClassName', () => {
    const { container } = render(
      <Card bodyClassName="custom-body">Content</Card>
    );

    const body = container.querySelector('.custom-body');
    expect(body).toBeInTheDocument();
  });

  it('should apply custom footerClassName', () => {
    const { container } = render(
      <Card footer={<div>Footer</div>} footerClassName="custom-footer">
        Content
      </Card>
    );

    const footer = container.querySelector('.custom-footer');
    expect(footer).toBeInTheDocument();
  });

  it('should render without header when no title, icon, or description', () => {
    render(<Card>Just content</Card>);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Just content')).toBeInTheDocument();
  });

  it('should render with custom ReactNode as icon', () => {
    render(
      <Card title="Title" icon={<span data-testid="custom-icon">🎉</span>}>
        Content
      </Card>
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('should handle ref properly', () => {
    const ref = { current: null } as { current: HTMLDivElement | null };

    render(
      <Card ref={ref}>
        <p>Content</p>
      </Card>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
