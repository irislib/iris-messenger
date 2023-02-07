import Component from '../BaseComponent';
import FollowButton from '../components/FollowButton';
import Header from '../components/Header';
import Identicon from '../components/Identicon';
import Name from '../components/Name';
import { translate as t } from '../translations/Translation';

const DEVELOPER = 'npub1g53mukxnjkcmr94fhryzkqutdz2ukq4ks0gvy5af25rgmwsl4ngq43drvk';

class About extends Component {
  render() {
    return (
      <>
        <Header />
        <div class="main-view" id="settings">
          <div class="centered-container mobile-padding15">
            <p>
              <b>Note 23.12.2022:</b> Heavily under construction: started integrating{' '}
              <a href="https://github.com/nostr-protocol/nostr">Nostr</a> this week.
            </p>
            <h2>{t('about')}</h2>
            <p>Iris is like the social networking apps we're used to, but better:</p>
            <ul>
              <li>
                <b>Accessible.</b> No phone number or signup required. Just type in your name or
                alias and go!
              </li>
              <li>
                <b>Secure.</b> It's open source. You can verify that your data stays safe.
              </li>
              <li>
                <b>Always available.</b> It works offline-first and is not dependent on any single
                centrally managed server. Users can even connect directly to each other.
              </li>
            </ul>
            <p>In other words, you can't be deplatformed from Iris.</p>

            <p>
              Released under MIT license. Code:{' '}
              <a href="https://github.com/irislib/iris-messenger">Github</a>.
            </p>

            <p>
              <ul>
                <li>
                  <a href="https://testflight.apple.com/join/5xdoDCmG">iOS Testflight</a>
                </li>
                <li>
                  <a href="https://play.google.com/store/apps/details?id=to.iris.twa">Android</a> (
                  <a href="https://github.com/irislib/iris-messenger/releases">apk</a>)
                </li>
              </ul>
            </p>

            <p>
              <small>Version 2.3.3</small>
            </p>

            <h3>Privacy</h3>
            <p>{t('application_security_warning')}</p>

            <h3>FAQ</h3>
            <p>
              <i>Why is there less spam than on other clients?</i>
            </p>
            <p>
              Iris rejects all content from authors that your social network has not interacted
              with. You get way less spam, but the downside is that discovery of new users is more
              difficult, and sometimes you don't see all the messages that appear on other clients.
            </p>
            <p>
              <a href="https://github.com/irislib/faq">More...</a>
            </p>

            <h3>Developer:</h3>
            <div class="profile-link-container">
              <a href={`/profile/${DEVELOPER}`} class="profile-link">
                <Identicon str={DEVELOPER} width={40} />
                <Name pub={DEVELOPER} placeholder="Iris developer's account" />
              </a>
              <FollowButton id={DEVELOPER} />
            </div>

            <h3>Contact</h3>
            <p>
              While we're working on Iris group chats, you're welcome to join our{' '}
              <a href="https://t.me/irismessenger">Telegram</a> channel.
            </p>

            <a href="https://opencollective.com/iris-social/donate" target="_blank">
              <img src="/assets/img/opencollective.png" width={200} />
            </a>
            <br />
          </div>
        </div>
      </>
    );
  }
}

export default About;
