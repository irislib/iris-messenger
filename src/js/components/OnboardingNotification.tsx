import { route } from 'preact-router';

import Component from '../BaseComponent';
import Helpers from '../Helpers';
import localState from '../LocalState';
import Key from '../nostr/Key';
import SocialNetwork from '../nostr/SocialNetwork';
import { translate as t } from '../translations/Translation';

import { PrimaryButton as Button } from './buttons/Button';
import Copy from './buttons/Copy';
import Follow from './buttons/Follow';
import Identicon from './Identicon';
import Name from './Name';

export default class OnboardingNotification extends Component {
  componentDidMount() {
    localState.get('noFollowers').on(this.inject());
    localState.get('hasNostrFollowers').on(this.inject());
    localState.get('showFollowSuggestions').on(this.inject());
    localState.get('showNoIrisToAddress').on(this.inject());
    localState.get('existingIrisToAddress').on(this.inject());
  }

  renderFollowSuggestions() {
    return (
      <div style="display:flex;flex-direction:column;flex:1">
        <p>{t('follow_someone_info')}</p>
        {SocialNetwork.SUGGESTED_FOLLOWS.map((pub) => (
          <div class="profile-link-container">
            <a href={`/${pub}`} className="profile-link">
              <Identicon str={pub} width={40} />
              <Name pub={pub} placeholder="Suggested follow" />
            </a>
            <Follow id={pub} />
          </div>
        ))}
        <p>
          <Button onClick={() => localState.get('showFollowSuggestions').put(false)}>
            {t('done')}
          </Button>
        </p>
        <p>
          {t('alternatively')}
          <i> </i>
          <a href={`/${Key.toNostrBech32Address(Key.getPubKey(), 'npub')}`}>
            {t('give_your_profile_link_to_someone')}
          </a>
          .
        </p>
      </div>
    );
  }

  renderNoFollowers() {
    return (
      <div style="display:flex;flex-direction:column;flex:1">
        <p>{t('no_followers_yet')}</p>
        <p>
          <Copy text={t('copy_link')} copyStr={Helpers.getMyProfileLink()} />
        </p>
        <small>{t('no_followers_yet_info')}</small>
      </div>
    );
  }

  renderGetIrisAddress() {
    if (!this.state.existingIrisToAddress) {
      return (
        <div>
          <p>Get your own iris.to/username?</p>
          <p>
            <Button onClick={() => route('/settings/iris_account')}>Yes please</Button>
            <Button onClick={() => localState.get('showNoIrisToAddress').put(false)}>
              No thanks
            </Button>
          </p>
        </div>
      );
    }
  }

  render() {
    let content;
    if (this.state.showFollowSuggestions) {
      content = this.renderFollowSuggestions();
    } else if (this.state.showNoIrisToAddress) {
      content = this.renderGetIrisAddress();
    } else if (this.state.noFollowers) {
      content = this.renderNoFollowers();
    }

    if (content) {
      return (
        <div class="msg">
          <div class="msg-content">{content}</div>
        </div>
      );
    }
    return '';
  }
}
