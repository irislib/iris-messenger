import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';

import { translate as t } from '@/translations/Translation.mjs';
import Login from '@/views/login/Login.tsx';

describe('Login View Rendering', () => {
  afterEach(cleanup);

  it('renders login form', async () => {
    render(<Login />);

    const loginInput = screen.getByPlaceholderText(t('whats_your_name'));
    expect(loginInput).not.toBeNull();

    const newUserButton = screen.getByText(t('new_user_go'));
    expect(newUserButton).not.toBeNull();

    const nostrExtensionLogin = screen.queryByText(t('nostr_extension_login'));
    // Depending on whether nostr is detected or not, this might be null
    if (nostrExtensionLogin) {
      expect(nostrExtensionLogin).not.toBeNull();
    }

    const privateKeyLoginLink = screen.getByText(t('private_key_login'));
    expect(privateKeyLoginLink).not.toBeNull();
  });

  it('displays ExistingAccountLogin when private key login is clicked', () => {
    render(<Login />);

    const privateKeyLoginLink = screen.getByText(t('private_key_login'));
    fireEvent.click(privateKeyLoginLink);

    const pastePrivateKeyInput = screen.getByPlaceholderText(t('paste_private_key'));
    expect(pastePrivateKeyInput).not.toBeNull();
  });

  // Add more tests if needed
});
