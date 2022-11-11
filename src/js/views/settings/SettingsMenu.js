import { html } from 'htm/preact';
import iris from 'iris-lib';
import { route } from 'preact-router';

import Component from '../../BaseComponent';
import Helpers from '../../Helpers';
import { translate as t } from '../../translations/Translation';

const SETTINGS = {
  account: 'account',
  key: 'private_key',
  peer: 'peers',
  language: 'language',
  webtorrent: 'webtorrent',
  webrtc: 'webRTC',
  beta: 'beta',
  blocked: 'blocked_users',
};

export default class SettingsMenu extends Component {
  menuLinkClicked(url, e) {
    e.preventDefault();
    iris.local().get('toggleSettingsMenu').put(false);
    iris.local().get('scrollUp').put(true);
    route(`/settings/${url}`);
  }

  render() {
    const activePage = this.props.activePage || 'account';
    return (
      <>
        <div className={!this.props.activePage ? 'settings-list' : 'settings-list hidden-xs'}>
          {Helpers.isElectron
            ? html`<div class="electron-padding" />`
            : html` <h3 class="visible-xs-block" style="padding: 0px 15px;">${t('settings')}</h3> `}
          {Object.keys(SETTINGS).map((page) => {
            return (
              <a
                href="#"
                class={activePage === page && window.innerWidth > 624 ? 'active' : ''}
                onClick={(e) => this.menuLinkClicked(page, e)}
                key={page}
              >
                <span class="text">{t(SETTINGS[page])}</span>
              </a>
            );
          })}
        </div>
      </>
    );
  }
}
