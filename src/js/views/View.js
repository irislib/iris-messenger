import Component from '../BaseComponent.js';
import { createRef } from 'preact';
import Header from '../components/Header.js';
import { html } from 'htm/preact';
import Session from "../Session";
import {translate as t} from "../Translation";
import Identicon from "../components/Identicon";
import FollowButton from "../components/FollowButton";
import CopyButton from "../components/CopyButton";
import Helpers from "../Helpers";
import State from "../State";

const SUGGESTED_FOLLOW = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

class View extends Component {
  scrollElement = createRef();

  render() {
    return html`
      <${this.props.header || Header}/>
      <div ref=${this.scrollElement} class="main-view ${this.class || ''}" id=${this.id}>
        ${this.renderView()}
      </div>
    `;
  }

  getNotification() {
    if (!this.followsSubscribed) {
      this.followsSubscribed = true;
      State.local.get('noFollowers').on(this.inject());
      State.local.get('noFollows').on(this.inject());
    }

    if (this.state.noFollows) {
      return html`
        <div class="msg">
          <div class="msg-content">
            <p>${t('follow_someone_info')}</p>
            <div class="profile-link-container">
              <a href="/profile/${SUGGESTED_FOLLOW}" class="profile-link">
                <${Identicon} str=${SUGGESTED_FOLLOW} width=40 />
                <iris-text path="profile/name" user=${SUGGESTED_FOLLOW} placeholder="Suggested follow"/>
              </a>
              <${FollowButton} id=${SUGGESTED_FOLLOW} />
            </div>
            <p>${t('alternatively')} <a href="/profile/${Session.getPubKey()}">${t('give_your_profile_link_to_someone')}</a>.</p>
          </div>
        </div>
      `
    }
    if (this.state.noFollowers) {
      return html`
        <div class="msg">
          <div class="msg-content">
            <p>${t('no_followers_yet')}</p>
            <p><${CopyButton} text=${t('copy_link')} copyStr=${Helpers.getProfileLink(Session.getPubKey())}/></p>
            <p dangerouslySetInnerHTML=${{
                __html: t(
                  'alternatively_get_sms_verified',
                  `href="https://iris-sms-auth.herokuapp.com/?pub=${Session.getPubKey()}"`
                )}}>
            </p>
            <small>${t('no_followers_yet_info')}</small>
          </div>
        </div>
      `;
    }
    return '';
  }
}

export default View;
