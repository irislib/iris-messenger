import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';

import localState from '@/state/LocalState.ts';
import { translate as t } from '@/translations/Translation.mjs';

import Header from './Header.tsx';

describe('Header Component Rendering', () => {
  afterEach(cleanup);

  it('renders iris logo for homepage', () => {
    localState.get('activeRoute').put('/');
    render(<Header />);

    const logo = screen.getByText('iris');
    expect(logo).not.toBeNull();
  });

  it('renders login and signup buttons when not logged in', () => {
    render(<Header />);

    const loginBtn = screen.getByText(t('log_in'));
    expect(loginBtn).not.toBeNull();

    const signupBtn = screen.getByText(t('sign_up'));
    expect(signupBtn).not.toBeNull();
  });
});
