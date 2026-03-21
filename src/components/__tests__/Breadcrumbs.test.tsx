import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Breadcrumbs } from '../Breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders breadcrumb items correctly', () => {
    render(
      <BrowserRouter>
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/' },
            { label: 'Books', path: '/books' },
            { label: 'Current Book' }
          ]}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Books')).toBeTruthy();
    expect(screen.getByText('Current Book')).toBeTruthy();
  });

  it('renders links for items with paths', () => {
    render(
      <BrowserRouter>
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/' },
            { label: 'Current' }
          ]}
        />
      </BrowserRouter>
    );

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink?.getAttribute('href')).toBe('/');
  });

  it('marks last item as current page', () => {
    render(
      <BrowserRouter>
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/' },
            { label: 'Current Page' }
          ]}
        />
      </BrowserRouter>
    );

    const currentItem = screen.getByText('Current Page');
    expect(currentItem.getAttribute('aria-current')).toBe('page');
  });

  it('applies custom className', () => {
    const { container } = render(
      <BrowserRouter>
        <Breadcrumbs
          items={[{ label: 'Home', path: '/' }]}
          className="custom-class"
        />
      </BrowserRouter>
    );

    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('custom-class');
  });

  it('renders chevron separators between items', () => {
    const { container } = render(
      <BrowserRouter>
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/' },
            { label: 'Books', path: '/books' },
            { label: 'Current' }
          ]}
        />
      </BrowserRouter>
    );

    const chevrons = container.querySelectorAll('svg');
    // Should have 2 chevrons for 3 items
    expect(chevrons.length).toBe(2);
  });
});
