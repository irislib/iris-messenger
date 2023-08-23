import { useEffect, useState } from 'preact/hooks';
import { Link } from 'preact-router';

import Name from '../../components/user/Name';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import localState from '../../state/LocalState.ts';
import { translate as t } from '../../translations/Translation.mjs';

const SocialNetworkSettings = () => {
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [globalFilter, setGlobalFilter] = useState<any>({});
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  let refreshInterval: any;

  const handleFilterChange = (e) => {
    const value = parseInt(e.target?.value);
    localState.get('globalFilter').get('maxFollowDistance').put(value);
  };

  const handleMinFollowersChange = (e) => {
    const value = parseInt(e.target?.value);
    localState.get('globalFilter').get('minFollowersAtMaxDistance').put(value);
  };

  useEffect(() => {
    SocialNetwork.getBlockedUsers((set) => setBlockedUsers(Array.from(set)));
    localState.get('globalFilter').on(setGlobalFilter);
    refreshInterval = setInterval(() => {
      // We might need some actual updating logic here
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const hasBlockedUsers = blockedUsers.some((user) => Key.toNostrBech32Address(user, 'npub'));
  const renderedBlockedUsers = blockedUsers.map((user) => {
    const bech32 = Key.toNostrBech32Address(user, 'npub');
    if (bech32) {
      return (
        <div key={user}>
          <Link href={`/${bech32}`}>
            <Name pub={user} />
          </Link>
        </div>
      );
    }
    return null;
  });

  const followDistances = Array.from(SocialNetwork.usersByFollowDistance.entries()).slice(1);

  return (
    <div class="centered-container">
      <h2>{t('social_network')}</h2>
      <h3>Stored on your device</h3>
      <p>Total size: {followDistances.reduce((a, b) => a + b[1].size, 0)} users</p>
      <p>Depth: {followDistances.length} degrees of separation</p>
      {followDistances.sort().map((distance) => (
        <div>
          {distance[0] || t('unknown')}: {distance[1].size} users
        </div>
      ))}
      <p>Filter incoming events by follow distance:</p>
      <select
        className="select"
        value={globalFilter.maxFollowDistance}
        onChange={handleFilterChange}
      >
        <option value={-1}>{t('off')}</option>
        <option value={1}>1</option>
        <option value={2}>2</option>
        <option value={3}>3 ({t('default')})</option>
        <option value={4}>4</option>
        <option value={5}>5</option>
      </select>
      <p>Minimum number of followers at maximum follow distance:</p>
      <input
        className="input"
        type="number"
        value={
          globalFilter.minFollowersAtMaxDistance ||
          Events.DEFAULT_GLOBAL_FILTER.minFollowersAtMaxDistance
        }
        onChange={handleMinFollowersChange}
      />
      <h3>{t('blocked_users')}</h3>
      {!hasBlockedUsers && t('none')}
      <p>
        <a
          href=""
          onClick={(e) => {
            e.preventDefault();
            setShowBlockedUsers(!showBlockedUsers);
          }}
        >
          {showBlockedUsers ? t('hide') : t('show')} {renderedBlockedUsers.length}
        </a>
      </p>
      {showBlockedUsers && renderedBlockedUsers}
    </div>
  );
};

export default SocialNetworkSettings;
