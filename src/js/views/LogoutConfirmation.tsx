import { route } from 'preact-router';

import Session from '../nostr/Session';
import { translate as t } from '../translations/Translation.mjs';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function LogoutConfirmation(_props) {
  return (
    <div class="main-view" id="logout-confirmation">
      <div class="centered-container">
        <p>{t('logout_confirmation_info')}</p>
        <p>
          <button className="btn btn-default" onClick={() => route('/settings')}>
            {t('back')}
          </button>
        </p>
        <p>
          <button className="btn btn-primary" onClick={() => Session.logOut()}>
            {t('log_out')}
          </button>
        </p>
      </div>
    </div>
  );
}
