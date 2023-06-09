import { XMarkIcon } from '@heroicons/react/24/solid';
import { route } from 'preact-router';
import styled from 'styled-components';

import Component from '../BaseComponent';
import Helpers from '../Helpers';
import localState from '../LocalState';
import Key from '../nostr/Key';
import { translate as t } from '../translations/Translation.mjs';

import { Button, PrimaryButton } from './buttons/Button';
import Copy from './buttons/Copy';
import Follow from './buttons/Follow';
import QRModal from './modal/QRModal';
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
    '"Fundamental investing with a global macro overlay"',
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
    '"Lover of memes, maker of videos"',
  ], // carla
];

const NoFollowersWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
`;

const CloseIconWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  cursor: pointer;
`;

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
                <Name pub={pub} placeholder="Suggested follow" />
                <br />
                <small>{description}</small>
              </div>
            </a>
            <Follow id={pub} />
          </div>
        ))}
        <p>
          <PrimaryButton onClick={() => localState.get('showFollowSuggestions').put(false)}>
            {t('done')}
          </PrimaryButton>
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
      <NoFollowersWrapper>
        <CloseIconWrapper onClick={() => localState.get('noFollowers').put(false)}>
          <XMarkIcon width={24} />
        </CloseIconWrapper>
        <p>{t('no_followers_yet')}</p>
        <p>
          <Copy text={t('copy_link')} copyStr={Helpers.getMyProfileLink()} />
          <Button onClick={() => this.setState({ showQrModal: true })}>{t('show_qr_code')}</Button>
        </p>
        <small>{t('no_followers_yet_info')}</small>
        {this.state.showQrModal && (
          <QRModal onClose={() => this.setState({ showQrModal: false })} pub={Key.getPubKey()} />
        )}
      </NoFollowersWrapper>
    );
  }

  renderGetIrisAddress() {
    if (!this.state.existingIrisToAddress) {
      return (
        <div>
          <p>Get your own iris.to/username?</p>
          <p>
            <PrimaryButton onClick={() => route('/settings/iris_account')}>
              Yes please
            </PrimaryButton>
            <PrimaryButton onClick={() => localState.get('showNoIrisToAddress').put(false)}>
              No thanks
            </PrimaryButton>
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
