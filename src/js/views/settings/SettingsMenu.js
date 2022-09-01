import Component from '../../BaseComponent';
import {translate as t} from '../../translations/Translation';
import { route } from 'preact-router';
import State from "../../State";
import Helpers from "../../Helpers";
import {html} from "htm/preact";

const SETTINGS = {
  account: 'account',
  key: 'private_key',
  peer: 'peer',
  language: 'language',
  webtorrent: 'webtorrent',
  webrtc: 'webRTC',
  beta: 'beta',
  blocked: 'blocked_users',
};

export default class SettingsMenu extends Component{

  menuLinkClicked(url) {
    State.local.get('toggleSettingsMenu').put(false);
    State.local.get('scrollUp').put(true);
    route(`/settings/${url}`);
  }

  render() {
    const activePage = this.props.activePage || 'account';
    return (
    <>
      <div className={!this.props.activePage ? 'settings-list' : 'settings-list hidden-xs' }>
      {Helpers.isElectron ? html`<div class="electron-padding"/>` : html`
        <h3 class="visible-xs-block" style="padding: 0px 15px;">${t('settings')}</h3>
      `}
      {Object.keys(SETTINGS).map(page => {
          return (
            <a class={(activePage === page && window.innerWidth > 624) ? 'active' : ''} onClick={() => this.menuLinkClicked(page)} key={page}>
              <span class="text">{t(SETTINGS[page])}</span>
            </a>
          );
        }
      )}
      </div>
    </>  
    ); 
  }
}
