import { route } from 'preact-router';

import Component from '../../BaseComponent';
import Icons from '../../Icons';
import localState from '../../LocalState';
import { translate as t } from '../../translations/Translation.mjs';

const SETTINGS = {
  account: 'account',
  appearance: 'appearance',
  content: 'content',
  payments: 'payments',
  network: 'network',
  backup: 'backup',
  language: 'language',
  social_network: 'social_network',
  iris_account: undefined as string | undefined,
};

if (['iris.to', 'beta.iris.to', 'localhost'].includes(window.location.hostname)) {
  SETTINGS.iris_account = 'iris.to';
}

export default class SettingsMenu extends Component {
  menuLinkClicked(url, e) {
    e.preventDefault();
    localState.get('toggleSettingsMenu').put(false);
    localState.get('scrollUp').put(true);
    route(`/settings/${url}`);
  }

  render() {
    const activePage = this.props.activePage || 'account';
    return (
      <div
        className={`flex-col w-48 flex-shrink-0 ${
          !this.props.activePage ? 'flex' : 'hidden md:flex'
        }`}
      >
        {Object.keys(SETTINGS).map((page) => {
          if (!SETTINGS[page]) return;
          return (
            <a
              href="#"
              className={`btn inline-flex w-auto flex items-center space-x-4 p-3 rounded-full transition-colors duration-200 hover:bg-neutral-900 ${
                activePage === page && window.innerWidth > 624 ? 'active' : ''
              }`}
              onClick={(e) => this.menuLinkClicked(page, e)}
              key={page}
            >
              <span class="text">
                {t(SETTINGS[page])}
                {page === 'language' && <small className="mar-left5">{Icons.language}</small>}
              </span>
            </a>
          );
        })}
      </div>
    );
  }
}
