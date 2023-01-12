import iris from 'iris-lib';

import Component from '../../BaseComponent';
import Name from '../../components/Name';
import Nostr from '../../Nostr';
import { translate as t } from '../../translations/Translation';

export default class BlockedSettings extends Component {
  constructor() {
    super();
    this.state = iris.session.DEFAULT_SETTINGS;
    this.state.webPushSubscriptions = {};
    this.state.blockedUsers = {};
    this.id = 'settings';
  }
  render() {
    return (
      <>
        <div class="centered-container">
          <h3>{t('blocked_users')}</h3>
          {Object.keys(this.state.blockedUsers).map((user) => {
            const bech32 = Nostr.toNostrBech32Address(user, 'npub');
            if (bech32 && this.state.blockedUsers[user]) {
              return (
                <p key={user}>
                  <a href={`/profile/${bech32}`}>
                    <Name pub={user} />
                  </a>
                </p>
              );
            }
          })}
          {Object.keys(this.state.blockedUsers).length === 0 ? t('none') : ''}
        </div>
      </>
    );
  }
  componentDidMount() {
    const blockedUsers = {};

    iris.electron && iris.electron.get('settings').on(this.inject('electron', 'electron'));
    iris
      .local()
      .get('settings')
      .on(
        this.sub((local) => {
          console.log('local settings', local);
          if (local) {
            this.setState({ local });
          }
        }),
      );
    iris
      .public()
      .get('block')
      .map()
      .on(
        this.sub((v, k) => {
          blockedUsers[k] = v;
          this.setState({ blockedUsers });
          console.log('blockedUsers', blockedUsers);
        }),
      );
  }
}
