import { useCallback, useEffect, useState } from 'react';
import { Event } from 'nostr-tools';
import { route } from 'preact-router';

import EventDB from '@/nostr/EventDB';

import Key from '../../nostr/Key';
import PubSub from '../../nostr/PubSub';
import SocialNetwork from '../../nostr/SocialNetwork';
import localState from '../../state/LocalState.ts';
import { translate as t } from '../../translations/Translation.mjs';
import Helpers from '../../utils/Helpers';
import { ID } from '../../utils/UniqueIds';
import Follow from '../buttons/Follow';
import Show from '../helpers/Show';
import HyperText from '../HyperText';

import Avatar from './Avatar';
import ProfileDropdown from './Dropdown';
import Name from './Name';
import ProfilePicture from './ProfilePicture';
import Stats from './Stats';

const ProfileCard = (props: { hexPub: string; npub: string }) => {
  const getWebsite = (websiteProfile: string) => {
    try {
      const tempWebsite = websiteProfile.match(/^https?:\/\//)
        ? websiteProfile
        : 'http://' + websiteProfile;
      const url = new URL(tempWebsite);
      return url.href.endsWith('/') ? url.href.slice(0, -1) : url.href;
    } catch (e) {
      return '';
    }
  };

  const getLightning = (profile: any) => {
    let lightning = profile.lud16 || profile.lud06;
    if (lightning && !lightning.startsWith('lightning:')) {
      lightning = 'lightning:' + lightning;
    }
    return lightning;
  };

  const { hexPub, npub } = props;
  const [profile, setProfile] = useState<any>(SocialNetwork.profiles.get(ID(hexPub)) || {});
  const [lightning, setLightning] = useState<string>(getLightning(profile));
  const [website, setWebsite] = useState<string>(getWebsite(profile.website));
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [nostrAddress, setNostrAddress] = useState<string>('');
  const [rawDataJson, setRawDataJson] = useState<string>('');
  const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
  const [blocked, setBlocked] = useState<boolean>(false);

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

          setLightning(getLightning(profile));
          setWebsite(getWebsite(profile.website));

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
    const profileEvent = EventDB.findOne({
      kinds: [0],
      authors: [hexPub],
    });
    const followEvent = EventDB.findOne({
      kinds: [3],
      authors: [hexPub],
    });
    if (profileEvent) {
      rawDataArray.push(profileEvent);
    }
    if (followEvent) {
      rawDataArray.push(followEvent);
    }
    setRawDataJson(JSON.stringify(rawDataArray, null, 2));
    setIsMyProfile(Key.isMine(hexPub));
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
      <div className="mb-2 mx-2 md:px-4 md:mx-0 flex flex-col gap-2">
        <div className="flex flex-row">
          <div className="-mt-24">{profilePicture}</div>
          <div className="flex-1 justify-end items-center flex gap-2">
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
            <ProfileDropdown
              hexPub={hexPub}
              npub={npub}
              rawDataJson={rawDataJson}
              isMyProfile={isMyProfile}
            />
          </div>
        </div>
        <div>
          <div className="flex-1">
            <span className="text-xl mr-2">
              <Name pub={hexPub} />
            </span>
            <small
              className={`inline-block text-iris-green ${
                profile.nip05 && profile.nip05valid ? 'visible' : 'invisible'
              }`}
            >
              {profile.nip05?.replace(/^_@/, '')}
            </small>
          </div>
          <Stats address={hexPub} />
          <div className="py-2">
            <p className="text-sm">
              <HyperText textOnly={true}>{profile.about?.slice(0, 500)}</HyperText>
            </p>
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
              <Show when={website}>
                <div className="flex-1">
                  <a href={website} target="_blank" rel="noopener noreferrer" className="link">
                    {website?.replace(/^https?:\/\//, '')}
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
