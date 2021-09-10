import {translate as t} from '../Translation.js';
import { html } from '../Helpers.js';
import View from './View.js';

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
          <li dangerouslySetInnerHTML=${{ __html: t('iris_is_accessible')}}></li>
          <li dangerouslySetInnerHTML=${{ __html: t('iris_is_secure')}}></li>
          <li dangerouslySetInnerHTML=${{ __html: t('iris_is_always_available')}}></li>
        </ul>
        <p> ${t('in_other_words')} </p>



        <p>Released under MIT license. Code: <a href="https://github.com/irislib/iris-messenger">Github</a>.</p>
        <p><small>Version 1.7.1</small></p>

        ${iris.util.isElectron ? '' : html`
          <div id="desktop-application-about">
            <h4> ${t('get_the_desktop_application')} </h4>
            <ul>
              <li> ${t('communicate_and_synchronize')} </li>

                <ul>
                <li> ${t('when_local_peers')} </li>
                <li> ${t('bluetooth_support_upcoming')} </li>

                </ul>

              <li> ${t('opens_to_background')}  </li>

              <li> ${t('more_secure_and_available')} </li>

              <li> ${t('direct_connect_to_the')} </li>
            </ul>
            <a href="https://github.com/irislib/iris-electron/releases">Download</a>
          </div>
        `}

        <h4>Privacy</h4>
        <p>Private messages are end-to-end encrypted, but message timestamps and the number of chats aren't. In a decentralized network this information is potentially available to anyone.</p>
        <p>By looking at timestamps in chats, it is possible to guess who are chatting with each other. There are potential technical solutions to hiding the timestamps, but they are not implemented yet. It is also possible, if not trivial, to find out who are communicating with each other by monitoring data subscriptions on the decentralized database.</p>
        <p>In that regard, Iris prioritizes decentralization and availability over perfect privacy.</p>
        <p>Profile names, photos and online status are currently public. That can be changed when advanced group permissions are developed.</p>
        <p>Iris makes no guarantees of data persistence.</p>
        <p>You can check your saved data in the <a href="https://iris.to/explorer">Explorer</a></p>
        <p> ${t('the_application_is_unaudited')}</p>

        <h4>${t('donate')}</h4>
        <p dangerouslySetInnerHTML=${{ __html:t('donate_info', "href=\"https://opencollective.com/iris-social\"") + ': 3GopC1ijpZktaGLXHb7atugPj9zPGyQeST' }}></p>
        <p>Dogecoin: DEsgP4H1Sjp4461PugHDNnoGd6S8pTvrm1</p>
      </div>
    `;
  }
}

export default About;
