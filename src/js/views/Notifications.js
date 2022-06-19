import { html } from 'htm/preact';
import State from '../State';
import Identicon from '../components/Identicon';
import {translate as t} from '../Translation';
import Name from '../components/Name';
import View from './View';
import iris from '../iris-lib';
import PublicMessage from "../components/PublicMessage";
import NotificationTools from "../Notifications";

export default class Notifications extends View {
  notifications = {};

  componentDidMount() {
    NotificationTools.changeUnseenNotificationCount(0);
    State.local.get('notifications').map().on(this.sub(
      (notification, time) => {
        if (notification) {
          this.notifications[time] = notification;
          NotificationTools.getNotificationText(notification).then(text => {
            this.notifications[time].text = text;
            this.setState({});
          });
        } else {
          delete this.notifications[time];
        }
        this.setState({d:new Date().toISOString()});
      }
    ));
  }

  shouldComponentUpdate() {
    return true;
  }

  renderView() {
    return html`
      <div class="centered-container public-messages-view">
        <h3>${t('notifications')}</h3>
        ${Object.keys(this.notifications).length === 0 ? html`
            <p> ${t('no_notifications_yet')}</p>
        `:''}
        ${Object.keys(this.notifications).sort().reverse().map(k => {
          const notification = this.notifications[k];
          return html`
            <div class="msg" key=${(notification.time||'') + (notification.from||'') + (notification.target||'')}>
              <div class="msg-content">
                <div class="msg-sender">
                  <a class="msg-sender-link" href="/profile/${notification.from}">
                    <${Identicon} str=${notification.from} width=30 />${' '}
                    <small class="msgSenderName"><${Name} pub=${notification.from} /></small>
                  </a>
                </div>
                ${notification.text || ''}
                ${notification.target ? html`<${PublicMessage} hash=${notification.target}/>` :''}
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
