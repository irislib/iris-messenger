import { route } from 'preact-router';

import Component from '../BaseComponent';
import Button from '../components/basic/Button';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

export default class LogoutConfirmation extends Component {
  render() {
    return (
      <div class="main-view" id="logout-confirmation">
        <div class="centered-container">
          <p dangerouslySetInnerHTML={{ __html: t('logout_confirmation_info') }}></p>
          <p>
            <Button onClick={() => route('/settings')}>{t('back')}</Button>
          </p>
          <p>
            <Button className="logout-button" onClick={() => Nostr.logOut()}>
              {t('log_out')}
            </Button>
          </p>
        </div>
      </div>
    );
  }
}
