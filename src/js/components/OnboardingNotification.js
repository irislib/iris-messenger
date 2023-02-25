import { html } from 'htm/preact';
import iris from 'iris-lib';

import Component from '../BaseComponent';
import Helpers from '../Helpers';
import Key from '../nostr/Key';
import Nostr from '../nostr/Nostr';
import { translate as t } from '../translations/Translation';

import Button from './basic/Button';
import CopyButton from './CopyButton';
import FollowButton from './FollowButton';
import Identicon from './Identicon';
import Name from './Name';

export default class OnboardingNotification extends Component {
  componentDidMount() {
    iris.local().get('noFollowers').on(this.inject());
    iris.local().get('hasNostrFollowers').on(this.inject());
    iris.local().get('showFollowSuggestions').on(this.inject());
  }

  render() {
    if (this.state.showFollowSuggestions) {
      return html`
        <div class="msg">
          <div class="msg-content">
            <div style="display:flex;flex-direction:column;flex:1">
              <p>${t('follow_someone_info')}</p>
              ${Nostr.SUGGESTED_FOLLOWS.map(
                (pub) => html`
                  <div class="profile-link-container">
                    <a href="/${pub}" className="profile-link">
                      <${Identicon} str=${pub} width="40" />
                      <${Name} pub=${pub} placeholder="Suggested follow" />
                    </a>
                    <${FollowButton} id=${pub} />
                  </div>
                `,
              )}
              <p>
                <${Button} onClick=${() => iris.local().get('showFollowSuggestions').put(false)}>
                  ${t('done')}
                </Button>
              </p>
              <p>
                ${t('alternatively')}<i> </i>
                <a
                  href="/${Nostr.toNostrBech32Address(
                    iris.session.getKey()?.secp256k1?.rpub,
                    'npub',
                  )}"
                  >${t('give_your_profile_link_to_someone')}</a
                >.
              </p>
            </div>
          </div>
        </div>
      `;
    }
    if (this.state.noFollowers && !this.state.hasNostrFollowers) {
      const rpub = iris.session.getKey()?.secp256k1?.rpub;
      const npub = rpub && Nostr.toNostrBech32Address(Key.getPubKey(), 'npub');
      return html`
        <div class="msg">
          <div class="msg-content">
            <div style="display:flex;flex-direction:column;flex:1">
              <p>${t('no_followers_yet')}</p>
              <p>
                <${CopyButton} text=${t('copy_link')} copyStr=${Helpers.getProfileLink(npub)} />
              </p>
              <small>${t('no_followers_yet_info')}</small>
            </div>
          </div>
        </div>
      `;
    }
    return '';
  }
}
