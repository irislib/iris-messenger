import Component from "../BaseComponent";
import State from "../State";
import {html} from "htm/preact";
import Helpers from "../Helpers";
import logo from "../../assets/img/icon128.png";
import logoType from "../../assets/img/iris_logotype.png";
import {Link} from "preact-router/match";
import {translate as t} from "../Translation";
import Icons from "../Icons";

const APPLICATIONS = [ // TODO: move editable shortcuts to localState gun
  {url: '/', text: t('home'), icon: Icons.home},
  {url: '/media', text: t('media'), icon: Icons.play},
  {url: '/chat', text: t('messages'), icon: Icons.chat},
  {url: '/store', text: t('market'), icon: Icons.store},
  {url: '/contacts', text: t('contacts'), icon: Icons.user},
  {url: '/settings', text: t('settings'), icon: Icons.settings},
  {url: '/explorer', text: t('explorer'), icon: Icons.folder},
  {url: '/about', text: t('about')},
];

export default class Menu extends Component {
  componentDidMount() {
    State.local.get('unseenTotal').on(this.inject());
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
            <img src=${logo} width=40 height=40/>
            <img src=${logoType} height=23 width=41 />
          </a>
        `}
        ${APPLICATIONS.map(a => {
          if (a.url) {
            return html`
              <${a.native ? 'a' : Link} onClick=${() => this.menuLinkClicked()} activeClassName="active" href=${a.url}>
                <span class="icon">
                  ${a.text === t('messages') && this.state.unseenTotal ? html`<span class="unseen unseen-total">${this.state.unseenTotal}</span>`: ''}
                  ${a.icon || Icons.circle}
                </span>
                <span class="text">${a.text}</span>
              <//>`;
          } 
            return html`<br/><br/>`;
          
        })}
      </div>
    `;
  }
}