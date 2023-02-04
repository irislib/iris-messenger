import { html } from 'htm/preact';
import iris from 'iris-lib';

import logo from '../../assets/img/icon128.png';
import Component from '../BaseComponent';
import Helpers from '../Helpers';
import Icons from '../Icons';
import { translate as t } from '../translations/Translation';

const APPLICATIONS = [
  // TODO: move editable shortcuts to localState gun
  { url: '/', text: 'following', icon: Icons.home },
  { url: '#/chat', text: 'messages', icon: Icons.chat },
  { url: '#/global', text: 'global_feed', icon: Icons.global },
  { url: '#/settings', text: 'settings', icon: Icons.settings },
  { url: '#/about', text: 'about', icon: Icons.info },
];

export default class Menu extends Component {
  state = {
    unseenMsgsTotal: 0,
    activeRoute: '',
    showBetaFeatures: false,
  };

  componentDidMount() {
    iris.local().get('unseenMsgsTotal').on(this.inject());
    iris.local().get('activeRoute').on(this.inject());
  }

  menuLinkClicked() {
    iris.local().get('toggleMenu').put(false);
    iris.local().get('scrollUp').put(true);
  }

  render() {
    return html`
      <div class="application-list">
        ${Helpers.isElectron
          ? html`<div class="electron-padding" />`
          : html`
              <a tabindex="3" href="#/" onClick=${() => this.menuLinkClicked()} class="logo">
                <div class="mobile-menu-icon visible-xs-inline-block">${Icons.menu}</div>
                <img src=${logo} width="30" height="30" />
                <span style="font-size: 1.8em">iris</span>
              </a>
            `}
        ${APPLICATIONS.map((a) => {
          if (a.url && (!a.beta || this.state.showBetaFeatures)) {
            let isActive = this.state.activeRoute.startsWith(a.url.slice(1));
            if (a.url === '/') {
              isActive = this.state.activeRoute.length <= 1;
            }
            return html` <a
              onClick=${() => this.menuLinkClicked()}
              activeClassName="active"
              class=${isActive ? 'active' : ''}
              href=${a.url}
            >
              <span class="icon">
                ${a.text === 'messages' && this.state.unseenMsgsTotal
                  ? html`<span class="unseen unseen-total">${this.state.unseenMsgsTotal}</span>`
                  : ''}
                ${a.icon || Icons.circle}
              </span>
              <span class="text">${t(a.text)}</span>
            <//>`;
          }
        })}
      </div>
    `;
  }
}
