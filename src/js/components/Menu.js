import Component from "../BaseComponent";
import State from "../State";
import {html} from "htm/preact";
import Helpers from "../Helpers";
import logo from "../../assets/img/icon128.png";
import {Link} from "preact-router/match";
import {translate as t} from "../Translation";
import Icons from "../Icons";

const APPLICATIONS = [ // TODO: move editable shortcuts to localState gun
  {url: '/', text: t('home'), icon: Icons.home},
  {url: '/media', text: t('media'), icon: Icons.play},
  {url: '/chat/new', text: t('messages'), icon: Icons.chat},
  {url: '/store', text: t('market'), icon: Icons.store, beta: true },
  {url: '/contacts', text: t('contacts'), icon: Icons.user},
  {url: '/settings', text: t('settings'), icon: Icons.settings},
  {url: '/explorer', text: t('explorer'), icon: Icons.folder, beta: true },
  {url: '/about', text: t('about'), icon: Icons.info},
];

export default class Menu extends Component {
  componentDidMount() {
    State.local.get('unseenMsgsTotal').on(this.inject());
    State.local.get('settings').get('showBetaFeatures').on(this.inject());
  }

  menuLinkClicked() {
    State.local.get('toggleMenu').put(false);
    State.local.get('scrollUp').put(true);
  }

  render() {
    return html`
      <div class="application-list">
        ${Helpers.isElectron ? html`<div class="electron-padding"/>` : html`
          <a href="/" onClick=${() => this.menuLinkClicked()} tabindex="0" class="logo">
          <div class="mobile-menu-icon visible-xs-inline-block">${Icons.menu}</div>
            <img src=${logo} width=30 height=30/>
            <span style="font-size: 1.5em">iris</span>
          </a>
        `}
        ${APPLICATIONS.map(a => {
          if (a.url && (!a.beta || this.state.showBetaFeatures)) {
            return html`
              <${a.native ? 'a' : Link} onClick=${() => this.menuLinkClicked()} activeClassName="active" href=${a.url}>
                <span class="icon">
                  ${a.text === t('messages') && this.state.unseenMsgsTotal ? html`<span class="unseen unseen-total">${this.state.unseenMsgsTotal}</span>`: ''}
                  ${a.icon || Icons.circle}
                </span>
                <span class="text">${a.text}</span>
              <//>`;
          }
        })}
      </div>
    `;
  }
}