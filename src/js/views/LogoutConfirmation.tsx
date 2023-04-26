import { route } from 'preact-router';

import { PrimaryButton as Button } from '../components/buttons/Button';
import Session from '../nostr/Session';
import { translate as t } from '../translations/Translation';

export default function LogoutConfirmation() {
  return (
    <div class="main-view" id="logout-confirmation">
      <div class="centered-container">
        <p>{t('logout_confirmation_info')}</p>
        <p>
          <Button onClick={() => route('/settings')}>{t('back')}</Button>
        </p>
        <p>
          <Button className="logout-button" onClick={() => Session.logOut()}>
            {t('log_out')}
          </Button>
        </p>
      </div>
    </div>
  );
}
