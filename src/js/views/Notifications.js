import { html } from 'htm/preact';
import State from '../State.js';
import Identicon from '../components/Identicon.js';
import {translate as t} from '../Translation.js';
import Name from '../components/Name.js';
import View from './View.js';
import iris from 'iris-lib';
import PublicMessage from "../components/PublicMessage";

export default class Notifications extends View {
  notifications = {};

  componentDidMount() {
    State.local.get('notifications').map().on((notification, time) => {
      if (notification) {
        this.notifications[time] = notification;
      } else {
        delete this.notifications[time];
      }
      this.setState({});
    });
  }

  renderView() {
    return html`
      <div class="centered-container public-messages-view">
        <h3>${t('notifications')}</h3>
        ${Object.keys(this.notifications).length === 0 ? html`
            <p>No notifications yet</p>
        `:''}
        ${Object.keys(this.notifications).sort().reverse().map(k => {
          const notification = this.notifications[k];
          return html`
            <div class="msg" key=${notification.time + notification.target}>
              <div class="msg-content">
                <div class="msg-sender">
                  <a class="msg-sender-link" href="/profile/${notification.from}">
                    <${Identicon} str=${notification.from} width=30 />${' '}
                    <small class="msgSenderName"><${Name} pub=${notification.from} /></small> 
                  </a>
                </div>
                <a href="/post/${encodeURIComponent(notification.target)}">${notification.action === 'like' ? 'liked' : 'replied to'} your post</a>
                <${PublicMessage} hash=${notification.target}/>
                <div class="below-text">
                  <div class="time">${iris.util.formatDate(new Date(notification.time))}</div><br/>
                </div>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}
