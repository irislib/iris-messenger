import { html } from 'htm/preact';
import iris from 'iris-lib';
import { debounce } from 'lodash';

import Button from '../components/basic/Button';
import PublicMessage from '../components/PublicMessage';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

import View from './View';

const PAGE_SIZE = 10;

export default class Notifications extends View {
  class = 'public-messages-view';
  state = {
    displayCount: PAGE_SIZE,
    notifications: [],
  };

  updateNotifications = debounce(
    (notifications) => {
      if (notifications.length) {
        iris
          .local()
          .get('notificationsSeenTime')
          .put(Math.floor(Date.now() / 1000));
        iris.local().get('unseenNotificationCount').put(0);
      }
      this.setState({ notifications });
    },
    1000,
    { leading: true },
  );

  componentDidMount() {
    Nostr.getNotifications((notifications) => {
      if (!this.unmounted) {
        this.updateNotifications(notifications);
      }
    });
  }

  renderView() {
    const displayCount = this.state.displayCount;
    return html`
      <div class="centered-container" style="margin-bottom: 15px;">
        <br class="hidden-xs" />
        ${Object.keys(this.state.notifications).length === 0
          ? html` <p>${t('no_notifications_yet')}</p> `
          : ''}
        ${this.state.notifications.slice(0, this.state.displayCount).map((id) => {
          if (!id) return;
          return html` <${PublicMessage} key=${id} hash=${id} showName="{true}" /> `;
          /*
          return html`
            <div
              class="msg"
              key=${(notification.time || '') +
              (notification.from || '') +
              (notification.target || '')}
            >
              <div class="msg-content">
                <div class="msg-sender">
                  <a class="msg-sender-link" href="/profile/${notification.from}">
                    <${Identicon} str=${notification.from} width="30" />${' '}
                    <div class="msgSenderName"><${Name} pub=${notification.from} /></div>
                  </a>
                </div>
                ${notification.text || ''}
                ${notification.target ? html`<${PublicMessage} hash=${notification.target} />` : ''}
                <div class="below-text">
                  <div class="time">${iris.util.formatDate(new Date(notification.time))}</div>
                  <br />
                </div>
              </div>
            </div>
          `;
          */
        })}
        ${displayCount < this.state.notifications.length
          ? html`
              <p>
                <${Button}
                  onClick=${() => this.setState({ displayCount: displayCount + PAGE_SIZE })}
                >
                  ${t('show_more')}
                <//>
              </p>
            `
          : ''}
      </div>
    `;
  }
}
