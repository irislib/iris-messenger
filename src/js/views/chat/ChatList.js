import Component from '../../BaseComponent';
import Helpers from '../../Helpers';
import { html } from 'htm/preact';
import { translate as t } from '../../translations/Translation';
import State from '../../State';
import ChatListItem from './ChatListItem';
import { route } from 'preact-router';
import Notifications from '../../Notifications';
import ScrollViewport from 'preact-scroll-viewport';
import _ from 'lodash';
import $ from 'jquery';

class ChatList extends Component {
  
  constructor(props) {
    super(props);
    this.state = {chats: new Map(), hashtags: {}, latestTime: null};
  }

  componentDidMount() {
    const hashtags = {};
    State.local.get('channels').map(this.sub(
      (chat, id) => {
        if (!chat || id === 'public' || chat.name == null) {
          this.state.chats.has(id) && this.setState({chats: this.state.chats.delete(id)});
          return;
        }
        chat.latestTime = chat.latestTime || '';
        State.local.get('channels').get(id).get('latest').on(this.sub(
          (latest) => {
            this.setState({latestTime : latest});
            chat.latestTime = latest.time || '';
            chat.latest = latest;
            chat.id = id;
            this.setState({chats: this.state.chats.set(id, chat)});
          }
        ));
        chat.id = id;
        this.setState({chats: this.state.chats.set(id, chat)});
      }
    ));
    State.local.get('scrollUp').on(this.sub(
      () => Helpers.animateScrollTop('.chat-list')
    ));
    State.public.user().get('hashtagSubscriptions').map().on(this.sub(
      (isSubscribed, hashtag) => {
        if (isSubscribed) {
          hashtags[hashtag] = true;
        } else {
          delete hashtags[hashtag];
        }
        this.setState({hashtags});
      }
    ));

    if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      setTimeout(() => {
        $('#enable-notifications-prompt').slideDown();
      }, 5000);
    }
  }

  render() {
    const activeChat = this.props.activeChat;
    const sortedChats = _.orderBy(Array.from(this.state.chats.values()), ['latestTime', 'name'], ['desc', 'asc']);
    return html`<section class="sidebar ${this.props.class || ''}">
      <div id="enable-notifications-prompt" onClick=${() => Notifications.enableDesktopNotifications()}>
        <div class="title">${t('get_notified_new_messages')}</div>
        <div><a>${t('turn_on_desktop_notifications')}</a></div>
      </div>
      <div class="chat-list">
        <div class="chat-item new ${activeChat === 'new' ? 'active-item' : ''}" onClick=${() => route('/chat/new')}>
          <svg class="svg-inline--fa fa-smile fa-w-16" style="margin-right:10px;margin-top:3px" x="0px" y="0px"
              viewBox="0 0 510 510">
            <path fill="currentColor" d="M459,0H51C22.95,0,0,22.95,0,51v459l102-102h357c28.05,0,51-22.95,51-51V51C510,22.95,487.05,0,459,0z M102,178.5h306v51 H102V178.5z M306,306H102v-51h204V306z M408,153H102v-51h306V153z"/>
          </svg>
          ${t('new_chat')}
        </div>
        <${ScrollViewport}>
          ${sortedChats.map(chat =>
            html`<${ChatListItem}
              photo=${chat.photo}
              active=${chat.id === activeChat}
              key=${chat.id}
              chat=${chat}
              lates=${this.state.latestTime}/>`
            )
          }
        </${ScrollViewport}>
      </div>
    </section>`
  }
}

export default ChatList;
