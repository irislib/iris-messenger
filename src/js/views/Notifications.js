import { html } from 'htm/preact';
import State from '../State.js';
import Identicon from '../components/Identicon.js';
import {translate as t} from '../Translation.js';
import Name from '../components/Name.js';
import View from './View.js';
import iris from 'iris-lib';

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
      <div class="centered-container">
        <h3>${t('notifications')}</h3>
        ${Object.keys(this.notifications).length === 0 ? html`'
            <p>No notifications yet</p>
        `:''}
        ${Object.keys(this.notifications).sort().reverse().map(k => {
          const notification = this.notifications[k];
          return html`
            <p>
                ${iris.util.formatDate(new Date(notification.time))}<br/>
                <a href="/profile/${notification.from}">
                  <${Identicon} str=${notification.from} width=30 />${' '}
                  <${Name} pub=${notification.from} /> 
                </a>
                ${notification.action === 'like' ? ' liked ' : ' replied to '}
                <a href="/post/${encodeURIComponent(notification.target)}">your post</a>
            </p>
          `;
        })}
      </div>
    `;
  }
}
