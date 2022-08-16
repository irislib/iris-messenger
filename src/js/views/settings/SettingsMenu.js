import Component from '../../BaseComponent';
import {translate as t} from '../../Translation';
import { route } from 'preact-router';

const SETTINGS = [
  {url: 'AccountSettings', text: t('account')},
  {url: 'KeySettings', text: t('privateKey')},
  {url: 'PeerSettings', text: t('peer')},
  {url: 'LanguageSettings', text: t('language')},
  {url: 'WebtorretSettings', text: t('webtorret')},
  {url: 'WebRTCSettings', text: t('webRTC')},
  {url: 'BetaSettings', text: t('beta')},
  {url: 'BlockedSettings', text: t('blocked Users')},
];

export default class SettingsMenu extends Component{

  render() {
    return (
    <>
      <div class="settings-list">
      {SETTINGS.map((item) => {
          return (
            <a activeClassName="active" onClick={() => route(`/settings/${item.url}`)}>
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
