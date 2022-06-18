import Helpers from '../../Helpers';
import { html } from 'htm/preact';
import {createRef} from 'preact';
import { translate as t } from '../../Translation';
import State from '../../State';
import Identicon from '../../components/Identicon';
import ChatMessageForm from './ChatMessageForm';
import Name from '../../components/Name';
import Session from '../../Session';
import $ from 'jquery';
import {Helmet} from 'react-helmet';
import Component from '../../BaseComponent';
import MessageFeed from '../../components/MessageFeed';
import OnboardingNotification from "../../components/OnboardingNotification";

const caretDownSvg = html`
<svg x="0px" y="0px"
width="451.847px" height="451.847px" viewBox="0 0 451.847 451.847" style="enable-background:new 0 0 451.847 451.847;">
<g>
<path fill="currentColor" d="M225.923,354.706c-8.098,0-16.195-3.092-22.369-9.263L9.27,151.157c-12.359-12.359-12.359-32.397,0-44.751
c12.354-12.354,32.388-12.354,44.748,0l171.905,171.915l171.906-171.909c12.359-12.354,32.391-12.354,44.744,0
c12.365,12.354,12.365,32.392,0,44.751L248.292,345.449C242.115,351.621,234.018,354.706,225.923,354.706z"/>
</g>
</svg>
`;

function copyMyChatLinkClicked(e) {
  Helpers.copyToClipboard(Session.getMyChatLink());
  let te = $(e.target);
  let originalText = te.text();
  let originalWidth = te.width();
  te.width(originalWidth);
  te.text(t('copied'));
  setTimeout(() => {
    te.text(originalText);
    te.css('width', '');
  }, 2000);
}

export default class ChatMain extends Component {
  constructor() {
    super();
    this.hashtagChatRef = createRef();
    this.participants = {};
    this.state = {sortedParticipants: [], showParticipants: true, stickToBottom: true};
  }

  shouldComponentUpdate() {
    return true;
  }

  componentDidMount() {
    State.local.get('showParticipants').put(true);
    State.local.get('showParticipants').on(this.inject());
    State.group().on(`hashtagSubscriptions/${this.props.hashtag}`, this.sub(
      (isSubscribing, k, b, c, from) => {
        if (isSubscribing && !this.participants[from]) {
          this.participants[from] = {};
          State.public.user(from).get('activity').on(this.sub(
            (activity) => {
              if (this.participants[from]) { this.participants[from].activity = activity; }
              this.setSortedParticipants();
            }
          ));
        } else {
          delete this.participants[from];
        }
        this.setSortedParticipants();
      }
    ));
    State.local.get('hashtags').get(this.props.hashtag).get('msgDraft').once(m => $('.new-msg').val(m));
    const el = $("#message-view");
    el.off('scroll').on('scroll', () => {
      const scrolledToBottom = (el[0].scrollHeight - el.scrollTop() == el.outerHeight());
      if (this.state.stickToBottom && !scrolledToBottom) {
        this.setState({stickToBottom: false});
      } else if (!this.state.stickToBottom && scrolledToBottom) {
        this.setState({stickToBottom: true});
      }
    });
  }

  setSortedParticipants() {
    const sortedParticipants = Object.keys(this.participants)
    .sort((a, b) => {
      const aO = this.participants[a];
      const bO = this.participants[b];
      const aActive = new Date(aO && aO.activity && aO.activity.time || 0);
      const bActive = new Date(bO && bO.activity && bO.activity.time || 0);
      if (Math.abs(aActive - bActive) < 10000) {
        return a > b ? -1 : 1;
      }
      if (aActive > bActive) { return -1; }
      else if (aActive < bActive) { return 1; }
       return 0;
    });
    this.setState({sortedParticipants});
  }

  componentDidUpdate() {
    if (this.state.stickToBottom) {
      Helpers.scrollToMessageListBottom();
    }
    $('.msg-content img').off('load').on('load', () => this.state.stickToBottom && Helpers.scrollToMessageListBottom());
  }

  scrollDown() {
    Helpers.scrollToMessageListBottom();
    const el = document.getElementById("message-list");
    el && (el.style.paddingBottom = 0);
  }

  render() {
    return html`
      <${Helmet}><title>${this.chat && this.chat.name || 'Messages'}</title><//>
      <div id="chat-main">
        <div class="main-view public-messages-view" id="message-view" ref=${this.hashtagChatRef}>
          <${MessageFeed} reverse=${true} key=${this.props.hashtag} scrollElement=${this.hashtagChatRef.current} group="everyone" path="hashtags/${this.props.hashtag}"/>
          <${OnboardingNotification} />
          <div id="attachment-preview" class="attachment-preview" style="display:none"></div>
        </div>
        
        <div id="scroll-down-btn" style="display:none;" onClick=${() => this.scrollDown()}>${caretDownSvg}</div>
        
        <div id="not-seen-by-them" style="display: none">
          <p dangerouslySetInnerHTML=${{ __html: t('if_other_person_doesnt_see_message') }}></p>
          <p><button onClick=${e => copyMyChatLinkClicked(e)}>${t('copy_your_invite_link')}</button></p>
        </div>
        <div class="chat-message-form">
          <${ChatMessageForm} key=${this.props.hashtag} hashtag=${this.props.hashtag} onSubmit=${() => this.scrollDown()} />
        </div>
      </div>
      
      <div class="participant-list ${this.state.showParticipants ? 'open' : ''}">
        ${this.state.sortedParticipants.length ? html`
          <small>${this.state.sortedParticipants.length} ${t('subscribers')}</small>
        ` : ''}
        ${this.state.sortedParticipants.map(k =>
          html`
            <a href="/profile/${k}">
              <span class="text">
                <${Identicon} key="i${k}" str=${k} width=30 activity=${true}/>
                <${Name} pub=${k} key="t${k}" />
              </span>
            </a>
          `
        )}
      </div>
    `;
  }
}
