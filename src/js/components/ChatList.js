import { Component } from 'preact';
import { html } from '../Helpers.js';
import { translate as t } from '../Translation.js';
import State from '../State.js';
import ChatListItem from './ChatListItem.js';
import Helpers from '../Helpers.js';
import { route } from 'preact-router';
import Notifications from '../Notifications.js';
import ScrollViewport from 'preact-scroll-viewport';
import _ from 'lodash';
import $ from 'jquery';

class ChatList extends Component {
  constructor() {
    super();
    this.state = {chats: []};
  }

  componentDidMount() {
    const chats = {};
    const limitedUpdate = _.debounce(() => {
      const sortedChats = Object.values(chats)
        .filter(chat => chat.id !== 'public')
        .filter(chat => !!chat)
        .sort((a, b) => {
          if (b.latestTime === undefined || a.latestTime > b.latestTime) return -1;
          return 1;
        });
      this.setState({chats: sortedChats});
    }, 200);
    State.local.get('channels').map().on((chat, id) => {
      chat.id = id;
      chats[id] = chat;
      limitedUpdate();
    });
    State.local.get('scrollUp').on(() => Helpers.animateScrollTop('.chat-list'));

    if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      setTimeout(() => {
        $('#enable-notifications-prompt').slideDown();
      }, 5000);
    }
  }

  render() {
    const activeChat = window.location.pathname.replace('/chat/new', '').replace('/chat/', '');
    return html`<section class="sidebar ${this.props.class || ''}">
      <div id="enable-notifications-prompt" onClick=${() => Notifications.enableDesktopNotifications()}>
        <div class="title">${t('get_notified_new_messages')}</div>
        <div><a>${t('turn_on_desktop_notifications')}</a></div>
      </div>
      <div class="chat-list">
        <div class="chat-item new ${activeChat ? '' : 'active-item'}" onClick=${() => route('/chat/new')}>
          <svg class="svg-inline--fa fa-smile fa-w-16" style="margin-right:10px;margin-top:3px" x="0px" y="0px"
              viewBox="0 0 510 510">
            <path fill="currentColor" d="M459,0H51C22.95,0,0,22.95,0,51v459l102-102h357c28.05,0,51-22.95,51-51V51C510,22.95,487.05,0,459,0z M102,178.5h306v51 H102V178.5z M306,306H102v-51h204V306z M408,153H102v-51h306V153z"/>
          </svg>
          ${t('new_chat')}
        </div>
        <${ScrollViewport}>
          ${this.state.chats.map(chat =>
            html`<${ChatListItem}
              photo=${chat.photo}
              active=${chat.id === activeChat}
              key=${chat.id}
              chat=${chat}/>`
            )
          }
        </${ScrollViewport}>
      </div>
    </section>`
  }
}

export default ChatList;
