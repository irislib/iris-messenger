import { html } from 'htm/preact';
import State from '../../../iris-lib/src/State';
import Identicon from '../components/Identicon';
import Button from '../components/basic/Button';
import {translate as t} from '../translations/Translation';
import Name from '../components/Name';
import View from './View';
import iris from 'iris-lib';
import PublicMessage from "../components/PublicMessage";
import NotificationTools from "iris-lib/src/Notifications";

const PAGE_SIZE = 10;

export default class Notifications extends View {
  notifications = {};
  class = 'public-messages-view';
  state = {
    displayCount: PAGE_SIZE
  }

  componentDidMount() {
    NotificationTools.changeUnseenNotificationCount(0);
    State.local.get('notifications').map(this.sub(
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
    const displayCount = this.state.displayCount;
    const notificationKeys = Object.keys(this.notifications).sort().reverse();
    return html`
      <div class="centered-container" style="margin-bottom: 15px;">
        <h3>${t('notifications')}</h3>
        
        ${Object.keys(this.notifications).length === 0 ? html`
            <p> ${t('no_notifications_yet')}</p>
        `:''}
        ${notificationKeys.slice(0, this.state.displayCount).map(k => {
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
        ${displayCount < notificationKeys.length ? html`
          <div>
            <${Button} onClick=${() => this.setState({displayCount: displayCount + PAGE_SIZE})}>
              ${t('show_more')}
            <//>
          </div>
        ` : ''}
      </div>
    `;
  }
}
