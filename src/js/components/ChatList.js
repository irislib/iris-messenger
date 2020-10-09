import { Component } from '../lib/preact.js';import { html } from '../Helpers.js';
import { translate as t } from '../Translation.js';
import {localState, publicState} from '../Main.js';
import ChatListItem from './ChatListItem.js';
import Helpers from '../Helpers.js';
import Session from '../Session.js';
import { route } from '../lib/preact-router.es.js';
import Notifications from '../Notifications.js';

class ChatList extends Component {
  constructor() {
    super();
    this.state = {chats: []};
  }

  componentDidMount() {
    const chats = {};
    const limitedUpdate = _.debounce(() => {
      const sortedChats = Object.values(chats)
        .filter(chat => !!chat)
        .sort((a, b) => {
          if (b.latestTime === undefined || a.latestTime > b.latestTime) return -1;
          return 1;
        });
      this.setState({chats: sortedChats});
    }, 200);
    localState.get('activeRoute').on(activeRoute => this.setState({activeRoute}));
    localState.get('chats').map().on((chat, id) => {
      chat.id = id;
      chats[id] = chat;
      limitedUpdate();
    });
    publicState.user().get('profile').get('name').on(name => {
      if (name && typeof name === 'string') {
        $('.user-info .user-name').text(name);
      }
    });
    if (Session.getKey()) {
      $("#my-identicon").append(Helpers.getIdenticon(Session.getKey().pub, 40));
    }

    if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      setTimeout(() => {
        $('#enable-notifications-prompt').slideDown();
      }, 5000);
    }
  }

  render() {
    return html`<section class="sidebar ${this.props.class || ''}">
      <div id="enable-notifications-prompt" onClick=${() => Notifications.enableDesktopNotifications()}>
        <div class="title">${t('get_notified_new_messages')}</div>
        <div><a>${t('turn_on_desktop_notifications')}</a></div>
      </div>
      <div class="chat-list">
        <div class="chat-item new ${['/chat', '/chat/new'].indexOf(this.state.activeRoute) > -1  ? 'active-item' : ''}" onClick=${() => route('/chat/new')}>
          <svg class="svg-inline--fa fa-smile fa-w-16" style="margin-right:10px;margin-top:3px" x="0px" y="0px"
              viewBox="0 0 510 510">
            <path fill="currentColor" d="M459,0H51C22.95,0,0,22.95,0,51v459l102-102h357c28.05,0,51-22.95,51-51V51C510,22.95,487.05,0,459,0z M102,178.5h306v51 H102V178.5z M306,306H102v-51h204V306z M408,153H102v-51h306V153z"/>
          </svg>
          ${t('new_chat')}
        </div>
        ${this.state.chats.filter(chat => chat.id !== 'public').map(chat =>
          html`<${ChatListItem}
            photo=${chat.photo}
            active=${chat.id === (this.state.activeRoute && this.state.activeRoute.replace('/chat/', ''))}
            key=${chat.id}
            chat=${chat}/>`
          )
        }
      </div>
    </section>`
  }
}

export default ChatList;
