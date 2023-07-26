import { useCallback, useEffect, useState } from 'react';
import { route } from 'preact-router';

import Helpers from '../../Helpers';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import PubSub from '../../nostr/PubSub';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation.mjs';
import Follow from '../buttons/Follow';
import Show from '../helpers/Show';

import Avatar from './Avatar';
import ProfileDropdown from './Dropdown';
import Name from './Name';
import ProfilePicture from './ProfilePicture';

const ProfileCard = (props: { hexPub: string; npub: string }) => {
  const { hexPub, npub } = props;
  const [profile, setProfile] = useState<any>({});
  const [lightning, setLightning] = useState<string>('');
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [nostrAddress, setNostrAddress] = useState<string>('');
  const [rawDataJson, setRawDataJson] = useState<string>('');
  const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
  const [blocked, setBlocked] = useState<boolean>(false);
  const [followedUserCount, setFollowedUserCount] = useState<number>(0);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followerCountFromApi, setFollowerCountFromApi] = useState<number>(0);
  const [followedUserCountFromApi, setFollowedUserCountFromApi] = useState<number>(0);

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
          setFollowedUserCountFromApi(json.following?.length);
          setFollowerCountFromApi(json.followerCount);
        }
      });
    });

    setTimeout(() => {
      subscriptions.push(
        SocialNetwork.getFollowersByUser(address, (followers) => setFollowerCount(followers.size)),
      );
      subscriptions.push(
        SocialNetwork.getFollowedByUser(address, (followed) => setFollowedUserCount(followed.size)),
      );
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
          setLightning(lightning);

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
      <div className="mb-2 mx-4 md:px-4 md:mx-0 flex flex-col gap-2">
        <div className="flex flex-row">
          <div className={profile.banner ? '-mt-24' : ''}>{profilePicture}</div>
          <div className="flex-1 justify-end flex gap-2">
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
            <div>
              <ProfileDropdown
                hexPub={hexPub}
                npub={npub}
                rawDataJson={rawDataJson}
                isMyProfile={isMyProfile}
              />
            </div>
          </div>
        </div>
        <div className="profile-header-stuff">
          <div className="flex-1 profile-name">
            <span className="text-xl">
              <Name pub={hexPub} />
            </span>
            <Show when={profile.nip05 && profile.nip05valid}>
              <br />
              <small className="text-iris-green">{profile.nip05?.replace(/^_@/, '')}</small>
            </Show>
          </div>
          <div>
            <div className="text-sm flex gap-4">
              <a href={`/follows/${npub}`}>
                <b>{Math.max(followedUserCount, followedUserCountFromApi)}</b> {t('following')}
              </a>
              <a href={`/followers/${npub}`}>
                <b>{Math.max(followerCount, followerCountFromApi)}</b> {t('followers')}
              </a>
            </div>
            <Show when={SocialNetwork.isFollowing(hexPub, Key.getPubKey())}>
              <div>
                <small>{t('follows_you')}</small>
              </div>
            </Show>
          </div>
          <div className="py-2">
            <p className="text-sm">{profile.about}</p>
            <div className="flex flex-1 flex-row align-center justify-center mt-4">
              <Show when={lightning}>
                <div className="flex-1">
                  <a
                    className="btn btn-sm btn-neutral"
                    href={lightning}
                    onClick={(e) => Helpers.handleLightningLinkClick(e)}
                  >
                    ⚡ {t('tip_lightning')}
                  </a>
                </div>
              </Show>
              <Show when={profile.website}>
                <div className="flex-1">
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link"
                  >
                    {profile.website?.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;