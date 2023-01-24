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
            <h3>{t('about')}</h3>
            <p>{t('iris_is_like')}</p>
            <ul>
              <li dangerouslySetInnerHTML={{ __html: t('iris_is_accessible') }} />
              <li dangerouslySetInnerHTML={{ __html: t('iris_is_secure') }} />
              <li
                dangerouslySetInnerHTML={{
                  __html: t('iris_is_always_available'),
                }}
              />
            </ul>
            <p> {t('in_other_words')} </p>

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
                  <a href="https://play.google.com/store/apps/details?id=to.iris.twa">Android</a>
                </li>
              </ul>
            </p>

            <p>
              <small>Version 2.3.3</small>
            </p>

            <h4>Privacy</h4>
            <p>{t('application_security_warning')}</p>

            <h4>Developer:</h4>
            <div class="profile-link-container">
              <a href={`/profile/${DEVELOPER}`} class="profile-link">
                <Identicon str={DEVELOPER} width={40} />
                <Name pub={DEVELOPER} placeholder="Iris developer's account" />
              </a>
              <FollowButton id={DEVELOPER} />
            </div>

            <p>
              While we're working on Iris group chats, you're welcome to join our{' '}
              <a href="https://t.me/irismessenger">Telegram</a> channel.
            </p>

            <h4>{t('donate')}</h4>
            <p
              dangerouslySetInnerHTML={{
                __html: `${t(
                  'donate_info',
                  'href="https://opencollective.com/iris-social"',
                )}: bc1qypfnmcgf9cdxcw307u20qzdyxf66egdgj0ljze`,
              }}
            ></p>
          </div>
        </div>
      </>
    );
  }
}

export default About;
