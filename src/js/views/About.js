import {translate as t} from '../Translation.js';
import Helpers from '../Helpers.js';
import { html } from 'htm/preact';
import View from './View.js';
import Identicon from '../components/Identicon';
import FollowButton from '../components/FollowButton';

const DEVELOPER = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

class About extends View {
  constructor() {
    super();
    this.id = "settings";
  }

  renderView() {
    return html`
      <div class="centered-container">
        <h3>${t('about')}</h3>
        <p>${t('iris_is_like')}</p>
        <ul>
          <li><b>No phone number or signup required.</b> Just type in your name or alias and go!</li>
          <li><b>Secure</b>: It's open source. Users can validate that big brother doesn't read your private messages.</li>
          <li><b>Available</b>: It works offline-first and is not dependent on any single centrally managed server. Users can even connect directly to each other.</li>
        </ul>
        <p>In other words, <b>you can't be deplatformed from Iris</b>.</p>
        <p>Released under MIT license. Code: <a href="https://github.com/irislib/iris-messenger">Github</a>.</p>
        <p><small>Version 2.1.1</small></p>

        ${Helpers.isElectron ? '' : html`
          <div id="desktop-application-about">
            <h4>Get the desktop application</h4>
            <ul>
              <li>Communicate and synchronize with local network peers without Internet access
                <ul>
                  <li>When local peers eventually connect to the Internet, your messages are relayed globally</li>
                  <li>Bluetooth support upcoming</li>
                </ul>
              </li>
              <li>Opens to background on login: stay online and get message notifications</li>
              <li>More secure and available: no need to open the browser application from a server</li>
              <li>Direct-connect to the people you have an open chat with (if port 8767 open or upnp enabled in router)</li>
            </ul>
            <p><a href="https://github.com/irislib/iris-electron/releases">Download</a></p>
          </div>
        `}

        <h4>Privacy</h4>
        <p>Private messages are end-to-end encrypted, but message timestamps and the number of chats aren't. In a decentralized network this information is potentially available to anyone.</p>
        <p>By looking at timestamps in chats, it is possible to guess who are chatting with each other. There are potential technical solutions to hiding the timestamps, but they are not implemented yet. It is also possible, if not trivial, to find out who are communicating with each other by monitoring data subscriptions on the decentralized database.</p>
        <p>In that regard, Iris prioritizes decentralization and availability over perfect privacy.</p>
        <p>Profile names, photos and online status are currently public. That can be changed when advanced group permissions are developed.</p>
        <p>Iris makes no guarantees of data persistence.</p>
        <p>You can check your saved data in the <a href="/explorer">Explorer</a>.</p>
        <p>${t('application_security_warning')}</p>

        <h4>Developer:</h4>
        <div class="profile-link-container">
          <a href="/profile/${DEVELOPER}" class="profile-link">
            <${Identicon} str=${DEVELOPER} width=40 />
            <iris-text path="profile/name" user=${DEVELOPER} placeholder="Iris developer's account"/>
          </a>
          <${FollowButton} id=${DEVELOPER} />
        </div>
          
        <h4>${t('donate')}</h4>
        <p dangerouslySetInnerHTML=${{ __html:`${t('donate_info', "href=\"https://opencollective.com/iris-social\"")  }: 3GopC1ijpZktaGLXHb7atugPj9zPGyQeST` }}></p>
        <p>Dogecoin: DEsgP4H1Sjp4461PugHDNnoGd6S8pTvrm1</p>
      </div>
    `;
  }
}

export default About;
