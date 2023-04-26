import { route } from 'preact-router';

import Component from '../BaseComponent';
import Helpers from '../Helpers';
import localState from '../LocalState';
import Key from '../nostr/Key';
import { translate as t } from '../translations/Translation';

import { PrimaryButton as Button } from './buttons/Button';
import Copy from './buttons/Copy';
import Follow from './buttons/Follow';
import Identicon from './Identicon';
import Name from './Name';

const SUGGESTED_FOLLOWS = [
  [
    'npub1sn0wdenkukak0d9dfczzeacvhkrgz92ak56egt7vdgzn8pv2wfqqhrjdv9',
    '"I used to work for the government. Now I work for the public."',
  ], // snowden
  ['npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m', 'Former CEO of Twitter'], // jack
  [
    'npub1a2cww4kn9wqte4ry70vyfwqyqvpswksna27rtxd8vty6c74era8sdcw83a',
    'Fundamental investing with a global macro overlay',
  ], // Lyn Alden
  [
    'npub15dqlghlewk84wz3pkqqvzl2w2w36f97g89ljds8x6c094nlu02vqjllm5m',
    'MicroStrategy Founder & Chairman',
  ], // saylor
  ['npub1g53mukxnjkcmr94fhryzkqutdz2ukq4ks0gvy5af25rgmwsl4ngq43drvk', 'iris.to developer'], // sirius
  ['npub1z4m7gkva6yxgvdyclc7zp0vz4ta0s2d9jh8g83w03tp5vdf3kzdsxana6p', 'Digital artist'], // yegorpetrov
  [
    'npub1az9xj85cmxv8e9j9y80lvqp97crsqdu2fpu3srwthd99qfu9qsgstam8y8',
    'Bitcoin hardware entrepreneur and podcaster',
  ], // nvk
  [
    'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6',
    'Original developer of Nostr',
  ], // fiatjaf
  [
    'npub1hu3hdctm5nkzd8gslnyedfr5ddz3z547jqcl5j88g4fame2jd08qh6h8nh',
    'Lover of memes, maker of videos. #bitcoin',
  ], // carla
];

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
        {SUGGESTED_FOLLOWS.map(([pub, description]) => (
          <div class="profile-link-container">
            <a href={`/${pub}`} className="profile-link">
              <div>
                <Identicon str={pub} width={40} />
              </div>
              <div style="flex: 1">
                <Name displayNameOnly={true} pub={pub} placeholder="Suggested follow" />
                <br />
                <small>{description}</small>
              </div>
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
