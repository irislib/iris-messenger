import Component from '../../BaseComponent';
import Name from '../../components/Name';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation';

export default class SocialNetworkSettings extends Component {
  constructor() {
    super();
    this.state = {
      blockedUsers: [],
      globalFilter: {},
      defaultZapAmount: SocialNetwork.DEFAULT_ZAP_AMOUNT,
    };
  }
  render() {
    let hasBlockedUsers = false;
    let blockedUsers = Array.from(this.state.blockedUsers).map((user) => {
      const bech32 = Key.toNostrBech32Address(user, 'npub');
      if (bech32) {
        hasBlockedUsers = true;
        return (
          <div key={user}>
            <a href={`/${bech32}`}>
              <Name pub={user} />
            </a>
          </div>
        );
      }
    });

    const followDistances = Array.from(SocialNetwork.usersByFollowDistance.entries()).slice(1);

    return (
      <>
        <div class="centered-container">
          <h2>{t('social_network')}</h2>
          <h3>Stored on your device</h3>
          <p>Default Zap amount in sats:</p>
          <input
            type="number"
            value={this.state.defaultZapAmount}
            onChange={(e) => {
              this.state.defaultZapAmount = parseInt(e.target.value);
              SocialNetwork.setDefaultZapAmount(this.state.defaultZapAmount);
            }}
          />
          <p>Total size: {followDistances.reduce((a, b) => a + b[1].size, 0)} users</p>
          <p>Depth: {followDistances.length} degrees of separation</p>
          {followDistances.sort().map((distance) => (
            <div>
              {distance[0] || t('unknown')}: {distance[1].size} users
            </div>
          ))}
          <p>Filter incoming events by follow distance:</p>
          <select
            value={this.state.globalFilter.maxFollowDistance}
            onChange={(e) => {
              localState.get('globalFilter').get('maxFollowDistance').put(parseInt(e.target.value));
            }}
          >
            <option value="0">Off</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
          <p>Minimum number of followers at maximum follow distance:</p>
          <input
            type="number"
            value={
              this.state.globalFilter.minFollowersAtMaxDistance ||
              Events.DEFAULT_GLOBAL_FILTER.minFollowersAtMaxDistance
            }
            onChange={(e) => {
              localState
                .get('globalFilter')
                .get('minFollowersAtMaxDistance')
                .put(parseInt(e.target.value));
            }}
          />
          <h3>{t('blocked_users')}</h3>
          {!hasBlockedUsers && t('none')}
          <p>
            <a
              href=""
              onClick={(e) => {
                e.preventDefault();
                this.setState({ showBlockedUsers: !this.state.showBlockedUsers });
              }}
            >
              {this.state.showBlockedUsers ? t('hide') : t('show')} {blockedUsers.length}
            </a>
          </p>
          {this.state.showBlockedUsers && blockedUsers}
        </div>
      </>
    );
  }
  componentDidMount() {
    SocialNetwork.getBlockedUsers((blockedUsers) => {
      this.setState({ blockedUsers });
    });
    localState.get('globalFilter').on(this.inject());
    this.refreshInterval = setInterval(() => {
      this.forceUpdate();
    }, 1000);

    const defaultZapAmount = SocialNetwork.getDefaultZapAmount();

    this.setState({ defaultZapAmount });
  }

  componentWillUnmount() {
    clearInterval(this.refreshInterval);
  }
}
