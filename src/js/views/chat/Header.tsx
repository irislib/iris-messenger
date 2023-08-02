import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { route } from 'preact-router';

import Show from '../../components/helpers/Show';
import Avatar from '../../components/user/Avatar';
import Name from '../../components/user/Name';
import localState from '../../LocalState';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation.mjs';

const Header = ({ activeChat }) => {
  const backButtonClicked = () => {
    window.history.back();
  };

  const onTitleClicked = () => {
    window.scrollTo(0, 0);
    if (activeChat && activeChat.length > 15) {
      route('/' + Key.toNostrBech32Address(activeChat, 'npub'));
    }
  };

  const renderLoginBtns = () => {
    return (
      <div className="flex gap-2">
        <button
          className="btn btn-sm btn-primary"
          onClick={() => localState.get('showLoginModal').put(true)}
        >
          {t('log_in')}
        </button>
        <button
          className="btn btn-sm btn-neutral"
          onClick={() => localState.get('showLoginModal').put(true)}
        >
          {t('sign_up')}
        </button>
      </div>
    );
  };

  const pub = Key.getPubKey();
  const loggedIn = !!pub;

  return (
    <div className="sticky top-0 z-10 cursor-pointer flex flex-wrap" onClick={onTitleClicked}>
      <div className="w-full overflow-x-hidden bg-black md:bg-opacity-50 md:shadow-lg md:backdrop-blur-lg px-2">
        <div className="flex items-center justify-between h-12">
          <ArrowLeftIcon width={24} onClick={backButtonClicked} />
          <Show when={activeChat}>
            <div className="flex flex-row gap-2 items-center">
              <Avatar width={30} str={activeChat} />
              <Name pub={activeChat} />
            </div>
          </Show>
          <Show when={!activeChat}>
            <div className="flex flex-row gap-2 items-center">{t('chat')}</div>
          </Show>
          <Show when={loggedIn}>
            <div></div>
          </Show>
          <Show when={!loggedIn}>{renderLoginBtns()}</Show>
        </div>
      </div>
    </div>
  );
};

export default Header;
