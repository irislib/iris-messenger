import Component from "../BaseComponent";
import State from "../State";
import {html} from "htm/preact";
import Helpers from "../Helpers";
import logo from "../../assets/img/icon128.png";
import logoType from "../../assets/img/iris_logotype.png";
import {Link} from "preact-router/match";
import {translate as t} from "../Translation";
import Icons from "../Icons";
import _ from "lodash";

const APPLICATIONS = [ // TODO: move editable shortcuts to localState gun
  {url: '/', text: t('home'), icon: Icons.home},
  {url: '/media', text: t('media'), icon: Icons.play},
  {url: '/chat', text: t('messages'), icon: Icons.chat},
  {url: '/store', text: t('market'), icon: Icons.store},
  {url: '/contacts', text: t('contacts'), icon: Icons.user},
  {url: '/settings', text: t('settings'), icon: Icons.settings},
  {url: '/explorer', text: t('explorer'), icon: Icons.folder},
  {url: '/about', text: t('about'), icon: Icons.info},
];

export default class Menu extends Component {
  componentDidMount() {
    State.local.get('unseenMsgsTotal').on(this.inject());
    this.updatePeersFromGun();
    this.iv = setInterval(() => this.updatePeersFromGun(), 3000);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    clearInterval(this.iv);
  }

  updatePeersFromGun() {
    const peersFromGun = State.public.back('opt.peers') || {};
    const connectedPeers = _.filter(Object.values(peersFromGun), (peer) => {
      if (peer && peer.wire && peer.wire.constructor.name !== 'WebSocket') {
        console.log('WebRTC peer', peer);
      }
      return peer && peer.wire && peer.wire.hied === 'hi' && peer.wire.constructor.name === 'WebSocket';
    });
    this.setState({connectedPeers});
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
            <img src=${logoType} height=23 width=41 />
          </a>
        `}
        ${APPLICATIONS.map(a => {
          if (a.url) {
            return html`
              <${a.native ? 'a' : Link} onClick=${() => this.menuLinkClicked()} activeClassName="active" href=${a.url}>
                <span class="icon">
                  ${a.text === t('messages') && this.state.unseenMsgsTotal ? html`<span class="unseen unseen-total">${this.state.unseenMsgsTotal}</span>`: ''}
                  ${a.icon || Icons.circle}
                </span>
                <span class="text">${a.text}</span>
              <//>`;
          } 
            return html`<br/><br/>`;
          
        })}
        <p>
          <a href="/settings" class="tooltip ${this.state.connectedPeers && this.state.connectedPeers.length ? 'connected' : ''}">
            <span class="tooltiptext">${t('connected_peers')}</span>
            <small>
              <span class="icon">${Icons.network}</span>
              ${this.state.connectedPeers ? this.state.connectedPeers.length : ''}
            </small>
          </a>
        </p>
        
      </div>
    `;
  }
}