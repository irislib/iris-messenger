import { ArrowLeftIcon } from '@heroicons/react/24/solid';

import ConnectedRelaysIndicator from '@/components/header/ConnectedRelaysIndicator.tsx';
import LoginButtons from '@/components/header/LoginButtons.tsx';
import NotificationsButton from '@/components/header/NotificationsButton.tsx';
import Title from '@/components/header/Title.tsx';
import useLocalState from '@/state/useLocalState.ts';

import Key from '../../nostr/Key.ts';
import Show from '../helpers/Show.tsx';

declare global {
  interface Window {
    feed_selector_modal: any;
  }
}

const Header = () => {
  const backButtonClicked = () => {
    window.history.back();
  };

  const [activeRoute] = useLocalState('activeRoute', '');
  const [showConnectedRelays] = useLocalState('showConnectedRelays', false);

  const isHome = activeRoute === '/';
  const pub = Key.getPubKey();
  const loggedIn = !!pub;

  return (
    <div className="sticky top-0 z-10 cursor-pointer flex flex-wrap">
      <div className="w-full overflow-x-hidden bg-black md:bg-opacity-50 md:shadow-lg md:backdrop-blur-lg px-2">
        <div className="flex items-center justify-between h-12 overflow-hidden">
          <Show when={isHome}>
            <div className="flex flex-row items-center gap-2 md:hidden">
              <img src="/img/icon128.png" width="30" height="30" />
              <h1 className=" text-3xl">iris</h1>
            </div>
          </Show>
          <Show when={!isHome}>
            <ArrowLeftIcon width={24} onClick={() => backButtonClicked()} />
          </Show>
          <Show when={loggedIn && showConnectedRelays}>
            <ConnectedRelaysIndicator />
          </Show>
          <Title />
          <Show when={loggedIn}>
            <NotificationsButton />
          </Show>
          <Show when={!loggedIn}>
            <LoginButtons />
          </Show>
        </div>
      </div>
    </div>
  );
};

export default Header;
