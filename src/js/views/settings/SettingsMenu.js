import Component from '../../BaseComponent';
import {translate as t} from '../../Translation';
import { route } from 'preact-router';
import State from "../../State";
import Helpers from "../../Helpers";
import {html} from "htm/preact";

const SETTINGS = [
  {url: 'AccountSettings', text: t('account')},
  {url: 'KeySettings', text: t('privateKey')},
  {url: 'PeerSettings', text: t('peer')},
  {url: 'LanguageSettings', text: t('language')},
  {url: 'WebtorrentSettings', text: t('webtorrent')},
  {url: 'WebRTCSettings', text: t('webRTC')},
  {url: 'BetaSettings', text: t('beta')},
  {url: 'BlockedSettings', text: t('blocked Users')},
];

export default class SettingsMenu extends Component{

  menuLinkClicked(url) {
    State.local.get('toggleSettingsMenu').put(false);
    State.local.get('scrollUp').put(true);
    route(`/settings/${url}`);
  }

  render() {
    return (
    <>
      <div class="settings-list">
      {Helpers.isElectron ? html`<div class="electron-padding"/>` : html`
            <h2 style="padding: 0px 15px;">Settings</h2>
        `}
      {SETTINGS.map((item) => {
          return (
            <a activeClassName="active" onClick={() => this.menuLinkClicked(item.url)} key={item.id}>
              <span class="text">{item.text}</span>
            </a>
          );
        }
      )}
      </div>
    </>  
    ); 
  }
}
