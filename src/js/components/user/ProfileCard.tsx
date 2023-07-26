import { useEffect, useState } from 'react';

import Events from '../../nostr/Events';
import { translate as t } from '../../translations/Translation.mjs';
import Follow from '../buttons/Follow';
import Dropdown from '../Dropdown';
import Show from '../helpers/Show';
import QRModal from '../modal/QRModal';

import Avatar from './Avatar';
import ProfilePicture from './ProfilePicture';

interface Props {
  hexPub: string;
  npub: string;
  banner: boolean;
  picture: any;
  blocked: boolean;
  profilePictureError: boolean;
  loggedIn: boolean;
  isMyProfile: boolean;
  showQR: boolean;
  name: string;
  nip05: string;
  about: string;
  followedUserCount: number;
  followerCount: number;
}

const ProfileCard = (props: Props) => {
  const {
    hexPub,
    npub,
    banner,
    picture,
    blocked,
    profilePictureError,
    loggedIn,
    isMyProfile,
    showQR,
    name,
    nip05,
    about,
    followedUserCount,
    followerCount,
  } = props;
  const [rawDataJson, setRawDataJson] = useState<string>('');
  const [showQRState, setShowQRState] = useState<boolean>(showQR);
  const history = useHistory();

  useEffect(() => {
    const rawDataArray = [];
    const profileEvent = Events.db.findOne({
      kind: 0,
      pubkey: hexPub,
    });
    const followEvent = Events.db.findOne({
      kind: 3,
      pubkey: hexPub,
    });
    if (profileEvent) {
      delete profileEvent.$loki;
      rawDataArray.push(profileEvent);
    }
    if (followEvent) {
      delete followEvent.$loki;
      rawDataArray.push(followEvent);
    }
    setRawDataJson(JSON.stringify(rawDataArray, null, 2));
  }, [hexPub]);

  const profilePicture =
    !blocked && !profilePictureError ? (
      <ProfilePicture
        key={`${hexPub}picture`}
        picture={picture}
        onError={() => /* Handle error here */ null}
      />
    ) : (
      <Avatar key={`${npub}avatar`} str={npub} hidePicture={true} width={128} />
    );
  const onClickHandler = () =>
    !loggedIn && /* Call localState.get('showLoginModal').put(true) here */ null;

  return (
    <div key={`${hexPub}details`}>
      <div className="mb-2 mx-2 md:px-2 md:mx-0 flex flex-col gap-2">
        <div className="flex flex-row">
          <div className={banner ? '-mt-20' : ''}>{profilePicture}</div>
          <div className="flex-1 justify-end flex">
            <div onClick={onClickHandler}>
              <Show when={isMyProfile}>
                <button
                  className="btn btn-sm btn-neutral"
                  onClick={() => loggedIn && history.push('/profile/edit')}
                >
                  {t('edit_profile')}
                </button>
              </Show>
              <Show when={!isMyProfile}>
                <Follow key={`${hexPub}follow`} id={hexPub} />
                {/* More stuff to add here */}
              </Show>
            </div>
            <div className="profile-actions">
              <Dropdown>{/* Add more things here */}</Dropdown>
            </div>
          </div>
        </div>
        {/* More code here */}
      </div>
      {showQRState && <QRModal pub={hexPub} onClose={() => setShowQRState(false)} />}
    </div>
  );
};

export default ProfileCard;
