import { route } from 'preact-router';

import Session from '../../nostr/Session.ts';
import { translate as t } from '../../translations/Translation.mjs';

// This should perhaps be a modal instead of a page
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function LogoutConfirmation(_props) {
  return (
    <div className="px-2 md:px-4 py-8 justify-center flex flex-col items-center">
      <div className="my-4">{t('logout_confirmation_info')}</div>
      <div className="my-4 flex flex-row gap-2">
        <button className="btn btn-neutral" onClick={() => route('/settings')}>
          {t('back')}
        </button>
        <button className="btn btn-primary" onClick={() => Session.logOut()}>
          {t('log_out')}
        </button>
      </div>
    </div>
  );
}
