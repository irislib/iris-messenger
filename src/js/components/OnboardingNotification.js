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

const SUGGESTED_FOLLOW = 'npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s';

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
              <a href="/profile/${SUGGESTED_FOLLOW}" class="profile-link">
                <${Identicon} str=${SUGGESTED_FOLLOW} width="40" />
                <${Name} pub=${SUGGESTED_FOLLOW} placeholder="Suggested follow" />
              </a>
              <${FollowButton} id=${SUGGESTED_FOLLOW} />
            </div>
            <p>
              ${t('alternatively')}<i> </i>
              <a href="/profile/${iris.session.getPubKey()}"
                >${t('give_your_profile_link_to_someone')}</a
              >.
            </p>
          </div>
        </div>
      `;
    }
    if (this.state.noFollowers && !this.state.hasNostrFollowers) {
      const rpub = iris.session.getKey().secp256k1.rpub;
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
