import Component from '../../BaseComponent';
import {translate as t} from '../../Translation';
import { route } from 'preact-router';
import State from "../../State";
import Helpers from "../../Helpers";
import {html} from "htm/preact";

const SETTINGS = [
  {url: 'account', text: t('account')},
  {url: 'key', text: t('privateKey')},
  {url: 'peer', text: t('peer')},
  {url: 'language', text: t('language')},
  {url: 'webtorrent', text: t('webtorrent')},
  {url: 'webrtc', text: t('webRTC')},
  {url: 'beta', text: t('beta')},
  {url: 'blocked', text: t('blocked Users')},
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
            <h3 style="padding: 0px 15px;">Settings</h3>
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
