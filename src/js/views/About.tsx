import Component from '../BaseComponent';
import FollowButton from '../components/FollowButton';
import Header from '../components/Header';
import Identicon from '../components/Identicon';
import Text from '../components/Text';
import Helpers from '../Helpers';
import { translate as t } from '../translations/Translation';

const DEVELOPER =
  'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

class About extends Component {
  render() {
    return (
      <>
        <Header />
        <div class="main-view" id="settings">
          <div class="centered-container">
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
              <small>Version 2.3.3</small>
            </p>

            <h4>Privacy</h4>
            <p>{t('application_security_warning')}</p>
            <p>
              Private messages are end-to-end encrypted, but message timestamps and the number of
              chats aren't. In a decentralized network this information is potentially available to
              anyone.
            </p>
            <p>
              By looking at timestamps in chats, it is possible to guess who are chatting with each
              other. There are potential technical solutions to hiding the timestamps, but they are
              not implemented yet. It is also possible, if not trivial, to find out who are
              communicating with each other by monitoring data subscriptions on the decentralized
              database.
            </p>
            <p>
              In that regard, Iris prioritizes decentralization and availability over perfect
              privacy.
            </p>
            <p>
              Profile names, photos and online status are currently public. That can be changed when
              advanced group permissions are developed.
            </p>
            <p>Iris makes no guarantees of data persistence.</p>
            <p>
              You can check your saved data in the <a href="/explorer">Explorer</a>.
            </p>

            <h4>Developer:</h4>
            <div class="profile-link-container">
              <a href={`/profile/${DEVELOPER}`} class="profile-link">
                <Identicon str={DEVELOPER} width={40} />
                <Text path="profile/name" user={DEVELOPER} placeholder="Iris developer's account" />
              </a>
              <FollowButton id={DEVELOPER} />
            </div>

            <p>
              While we're working on Iris group chats, you're welcome to join our{' '}
              <a href="https://discord.gg/4CJc74JEUY">Discord</a> community.
            </p>

            <h4>{t('donate')}</h4>
            <p
              dangerouslySetInnerHTML={{
                __html: `${t(
                  'donate_info',
                  'href="https://opencollective.com/iris-social"',
                )}: 3GopC1ijpZktaGLXHb7atugPj9zPGyQeST`,
              }}
            ></p>
            <p>Dogecoin: DEsgP4H1Sjp4461PugHDNnoGd6S8pTvrm1</p>
          </div>
        </div>
      </>
    );
  }
}

export default About;
