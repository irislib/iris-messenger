import { html } from 'htm/preact';
import iris from 'iris-lib';

import Component from '../BaseComponent';
import Helpers from '../Helpers';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

import CopyButton from './CopyButton';
import FollowButton from './FollowButton';
import Identicon from './Identicon';
import Name from './Name';

export default class OnboardingNotification extends Component {
  componentDidMount() {
    iris.local().get('noFollowers').on(this.inject());
    iris.local().get('hasNostrFollowers').on(this.inject());
    iris.local().get('noFollows').on(this.inject());
  }

  render() {
    if (this.state.noFollows) {
      return html`
        <div class="msg">
          <div class="msg-content">
            <p>${t('follow_someone_info')}</p>
            <div class="profile-link-container">
              <a href="#/profile/${Nostr.SUGGESTED_FOLLOW}" class="profile-link">
                <${Identicon} str=${Nostr.SUGGESTED_FOLLOW} width="40" />
                <${Name} pub=${Nostr.SUGGESTED_FOLLOW} placeholder="Suggested follow" />
              </a>
              <${FollowButton} id=${Nostr.SUGGESTED_FOLLOW} />
            </div>
            <p>
              ${t('alternatively')}<i> </i>
              <a
                href="#/profile/${Nostr.toNostrBech32Address(
                  iris.session.getKey()?.secp256k1?.rpub,
                  'npub',
                )}"
                >${t('give_your_profile_link_to_someone')}</a
              >.
            </p>
          </div>
        </div>
      `;
    }
    if (this.state.noFollowers && !this.state.hasNostrFollowers) {
      const rpub = iris.session.getKey()?.secp256k1?.rpub;
      const npub = rpub && Nostr.toNostrBech32Address(iris.session.getKey().secp256k1.rpub, 'npub');
      return html`
        <div class="msg">
          <div class="msg-content">
            <p>${t('no_followers_yet')}</p>
            <p>
              <${CopyButton} text=${t('copy_link')} copyStr=${Helpers.getProfileLink(npub)} />
            </p>
            <!--<p
              dangerouslySetInnerHTML=${{
              __html: t(
                'alternatively_get_sms_verified',
                `href="https://iris-sms-auth.herokuapp.com/?pub=${iris.session.getPubKey()}"`,
              ),
            }}
            ></p>-->
            <small>${t('no_followers_yet_info')}</small>
          </div>
        </div>
      `;
    }
    return '';
  }
}
