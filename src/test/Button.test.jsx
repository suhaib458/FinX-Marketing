import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import React from 'react';
import Button from '../components/ui/Button';

describe('Button link support', () => {
  it('renders an accessible anchor when href is supplied', () => {
    render(React.createElement(Button, { href: '#how-it-works' }, 'How it works'));
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '#how-it-works');
  });

  it('defaults ordinary buttons to type button', () => {
    render(React.createElement(Button, null, 'Action'));
    expect(screen.getByRole('button', { name: 'Action' })).toHaveAttribute('type', 'button');
  });
});
