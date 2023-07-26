import { useCallback, useEffect, useState } from 'react';
import { route } from 'preact-router';

import Block from '../../components/buttons/Block';
import Report from '../../components/buttons/Report';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import PubSub from '../../nostr/PubSub';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation.mjs';
import Copy from '../buttons/Copy';
import Follow from '../buttons/Follow';
import Dropdown from '../Dropdown';
import Show from '../helpers/Show';
import QRModal from '../modal/QRModal';

import Avatar from './Avatar';
import Name from './Name';
import ProfilePicture from './ProfilePicture';

const ProfileCard = (props: { hexPub: string; npub: string }) => {
  const { hexPub, npub } = props;
  const [profile, setProfile] = useState<any>({});
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [nostrAddress, setNostrAddress] = useState<string>('');
  const [rawDataJson, setRawDataJson] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
  const [blocked, setBlocked] = useState<boolean>(false);
  const [followedUserCount, setFollowedUserCount] = useState<number>(0);
  const [followerCount, setFollowerCount] = useState<number>(0);

  async function viewAs(event) {
    event.preventDefault();
    route('/');
    Key.login({ rpub: hexPub });
  }

  const getNostrProfile = useCallback((address, nostrAddress) => {
    const subscriptions = [] as any[];
    subscriptions.push(
      PubSub.subscribe(
        {
          authors: [address],
          kinds: [0, 3],
        },
        undefined,
        false,
        false,
      ),
    );
    fetch(`https://eu.rbr.bio/${address}/info.json`).then((res) => {
      if (!res.ok) {
        return;
      }
      res.json().then((json) => {
        if (json) {
          setFollowedUserCount(json.following?.length || followedUserCount);
          setFollowerCount(json.followerCount || followerCount);
        }
      });
    });
    const setFollowCounts = () => {
      if (address) {
        setFollowedUserCount(
          Math.max(SocialNetwork.followedByUser.get(address)?.size ?? 0, followedUserCount),
        );
        setFollowerCount(
          Math.max(SocialNetwork.followersByUser.get(address)?.size ?? 0, followerCount),
        );
      }
    };
    setTimeout(() => {
      subscriptions.push(SocialNetwork.getFollowersByUser(address, setFollowCounts));
      subscriptions.push(SocialNetwork.getFollowedByUser(address, setFollowCounts));
    }, 1000); // this causes social graph recursive loading, so let some other stuff like feed load first
    subscriptions.push(
      SocialNetwork.getProfile(
        address,
        (profile) => {
          if (!profile) {
            return;
          }
          const isIrisAddress = nostrAddress && nostrAddress.endsWith('@iris.to');
          if (!isIrisAddress && profile.nip05 && profile.nip05valid) {
            // replace url and history entry with iris.to/${profile.nip05} or if nip is user@iris.to, just iris.to/${user}
            // TODO don't replace if at /likes or /replies
            const nip05 = profile.nip05;
            const nip05Parts = nip05.split('@');
            const nip05User = nip05Parts[0];
            const nip05Domain = nip05Parts[1];
            let newUrl;
            if (nip05Domain === 'iris.to') {
              if (nip05User === '_') {
                newUrl = 'iris';
              } else {
                newUrl = nip05User;
              }
            } else {
              if (nip05User === '_') {
                newUrl = nip05Domain;
              } else {
                newUrl = nip05;
              }
            }
            setNostrAddress(newUrl);
            // replace part before first slash with new url
            newUrl = window.location.pathname.replace(/[^/]+/, newUrl);
            const previousState = window.history.state;
            window.history.replaceState(previousState, '', newUrl);
          }

          let lightning = profile.lud16 || profile.lud06;
          if (lightning && !lightning.startsWith('lightning:')) {
            lightning = 'lightning:' + lightning;
          }

          let website =
            profile.website &&
            (profile.website.match(/^https?:\/\//) ? profile.website : 'http://' + profile.website);
          // remove trailing slash
          if (website && website.endsWith('/')) {
            website = website.slice(0, -1);
          }

          setProfile(profile);
        },
        true,
      ),
    );
    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, []);

  useEffect(() => {
    const rawDataArray = [] as Event[];
    const profileEvent = Events.db.findOne({
      kind: 0,
      pubkey: hexPub,
    });
    const followEvent = Events.db.findOne({
      kind: 3,
      pubkey: hexPub,
    });
    if (profileEvent) {
      rawDataArray.push(profileEvent);
    }
    if (followEvent) {
      rawDataArray.push(followEvent);
    }
    setRawDataJson(JSON.stringify(rawDataArray, null, 2));
    setIsMyProfile(hexPub === Key.getPubKey());
    getNostrProfile(hexPub, nostrAddress);
    const unsubLoggedIn = localState.get('loggedIn').on((loggedIn) => {
      setLoggedIn(loggedIn);
    });
    const unsubBlocked = SocialNetwork.getBlockedUsers((blockedUsers) => {
      setBlocked(blockedUsers.has(hexPub));
    });
    return () => {
      unsubBlocked();
      unsubLoggedIn();
    };
  }, [hexPub]);

  const profilePicture = !blocked ? (
    <ProfilePicture
      key={`${hexPub}picture`}
      picture={profile.picture}
      onError={() => /* Handle error here */ null}
    />
  ) : (
    <Avatar key={`${npub}avatar`} str={npub} hidePicture={true} width={128} />
  );
  const onClickHandler = () => !loggedIn && localState.get('showLoginModal').put(true);

  return (
    <div key={`${hexPub}details`}>
      <div className="mb-2 mx-2 md:px-2 md:mx-0 flex flex-col gap-2">
        <div className="flex flex-row">
          <div className={profile.banner ? '-mt-20' : ''}>{profilePicture}</div>
          <div className="flex-1 justify-end flex">
            <div onClick={onClickHandler}>
              <Show when={isMyProfile}>
                <a className="btn btn-sm btn-neutral" href="/profile/edit">
                  {t('edit_profile')}
                </a>
              </Show>
              <Show when={!isMyProfile}>
                <Follow key={`${hexPub}follow`} id={hexPub} />
                <button
                  className="btn btn-neutral btn-sm"
                  onClick={() => loggedIn && route(`/chat/${npub}`)}
                >
                  {t('send_message')}
                </button>
              </Show>
            </div>
            <div className="profile-actions">
              <Dropdown>
                <Copy
                  className="btn btn-sm"
                  key={`${hexPub}copyLink`}
                  text={t('copy_link')}
                  copyStr={window.location.href}
                />
                <Copy
                  className="btn btn-sm"
                  key={`${hexPub}copyNpub`}
                  text={t('copy_user_ID')}
                  copyStr={npub}
                />
                <button className="btn btn-sm" onClick={() => setShowQrCode(true)}>
                  {t('show_qr_code')}
                </button>
                <Copy
                  className="btn btn-sm"
                  key={`${hexPub}copyData`}
                  text={t('copy_raw_data')}
                  copyStr={rawDataJson}
                />
                <Show when={!isMyProfile && !Key.getPrivKey()}>
                  <button className="btn btn-sm" onClick={viewAs}>
                    {t('view_as') + ' '}
                    <Name pub={hexPub} hideBadge={true} />
                  </button>
                </Show>
                <Show when={!isMyProfile}>
                  <>
                    <Block className="btn btn-sm" id={hexPub} />
                    <Report className="btn btn-sm" id={hexPub} />
                  </>
                </Show>
              </Dropdown>
            </div>
          </div>
        </div>
        {/* More code here */}
      </div>
      <Show when={showQrCode}>
        <QRModal pub={hexPub} onClose={() => setShowQrCode(false)} />
      </Show>
    </div>
  );
};

export default ProfileCard;
