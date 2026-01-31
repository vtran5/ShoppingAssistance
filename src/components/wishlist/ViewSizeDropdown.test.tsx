import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewSizeDropdown } from './ViewSizeDropdown';
import { ItemViewSize } from '@/types';

describe('ViewSizeDropdown', () => {
  it('renders with the correct value selected', () => {
    const onChange = vi.fn();
    render(<ViewSizeDropdown value="medium" onChange={onChange} />);

    const select = screen.getByRole('combobox', { name: /items per row/i });
    expect(select).toHaveValue('medium');
  });

  it('renders all view size options', () => {
    const onChange = vi.fn();
    render(<ViewSizeDropdown value="large" onChange={onChange} />);

    expect(screen.getByRole('option', { name: '1 per row' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2 per row' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '4 per row' })).toBeInTheDocument();
  });

  it('calls onChange with new value when selection changes', () => {
    const onChange = vi.fn();
    render(<ViewSizeDropdown value="large" onChange={onChange} />);

    const select = screen.getByRole('combobox', { name: /items per row/i });
    fireEvent.change(select, { target: { value: 'small' } });

    expect(onChange).toHaveBeenCalledWith('small');
  });

  it('displays the label', () => {
    const onChange = vi.fn();
    render(<ViewSizeDropdown value="large" onChange={onChange} />);

    expect(screen.getByText('View:')).toBeInTheDocument();
  });

  it('has accessible aria-label', () => {
    const onChange = vi.fn();
    render(<ViewSizeDropdown value="large" onChange={onChange} />);

    const select = screen.getByLabelText(/items per row/i);
    expect(select).toBeInTheDocument();
  });

  it.each<ItemViewSize>(['large', 'medium', 'small'])(
    'correctly displays %s as selected value',
    (size) => {
      const onChange = vi.fn();
      render(<ViewSizeDropdown value={size} onChange={onChange} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue(size);
    }
  );
});
