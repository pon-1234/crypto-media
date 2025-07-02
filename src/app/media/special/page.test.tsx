import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SpecialPage from './page';

/**
 * @doc ./page.tsx
 * @related ./page.tsx - 特集ページコンポーネント
 */
describe('SpecialPage', () => {
  it('should render the heading', () => {
    render(<SpecialPage />);
    const heading = screen.getByRole('heading', {
      name: /特集ページ/i,
    });
    expect(heading).toBeInTheDocument();
  });
}); 