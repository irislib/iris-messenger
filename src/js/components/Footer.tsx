import { HomeIcon, PaperAirplaneIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconFull,
  MagnifyingGlassIcon,
  PaperAirplaneIcon as PaperAirplaneIconFull,
  PlusCircleIcon as PlusCircleIconFull,
} from '@heroicons/react/24/solid';
import { useEffect, useState } from 'preact/hooks';
import { Link } from 'preact-router';

import localState from '../LocalState';
import Key from '../nostr/Key';
import Icons from '../utils/Icons';

import Show from './helpers/Show';
import Avatar from './user/Avatar';

const MENU_ITEMS = [
  { url: '/', icon: HomeIcon, activeIcon: HomeIconFull },
  { url: '/chat', icon: PaperAirplaneIcon, activeIcon: PaperAirplaneIconFull },
  { url: '/post/new', icon: PlusCircleIcon, activeIcon: PlusCircleIconFull },
  { url: '/search', icon: MagnifyingGlassIcon, activeIcon: Icons.magnifyingGlassBold },
];

const Footer = () => {
  const [isMyProfile, setIsMyProfile] = useState(false);
  const [activeRoute, setActiveRoute] = useState('/');
  const [chatId, setChatId] = useState(null);

  useEffect(() => {
    localState.get('isMyProfile').on((value) => setIsMyProfile(value));
    localState.get('activeRoute').on((activeRoute) => {
      const replaced = activeRoute.replace('/chat/new', '').replace('/chat/', '');
      const chatId = replaced.length < activeRoute.length ? replaced : null;
      setActiveRoute(activeRoute);
      setChatId(chatId);
    });
  }, []);

  const scrollToTop = (shouldScroll) => {
    if (shouldScroll) {
      window.scrollTo({
        top: 0,
      });
    }
  };

  const renderButton = (href, Icon, IconActive) => {
    const isActive = new RegExp(`^${href}(/|$)`).test(activeRoute);

    return (
      <Link
        href={href}
        className={`btn flex-grow ${isActive ? 'active' : ''}`}
        onClick={() => scrollToTop(isActive)}
      >
        <Show when={isActive}>
          <IconActive width={24} />
        </Show>
        <Show when={!isActive}>
          <Icon width={24} />
        </Show>
      </Link>
    );
  };

  const key = Key.toNostrBech32Address(Key.getPubKey(), 'npub');

  return (
    <Show when={key && !chatId}>
      <footer className="fixed md:hidden bottom-0 z-10 w-full bg-base-200 pb-safe-area">
        <div className="flex">
          {MENU_ITEMS.map((item) => renderButton(item.url, item.icon, item.activeIcon))}
          <Link
            href={`/${key}`}
            onClick={() => scrollToTop(isMyProfile)}
            className="rounded-full btn flex flex-grow"
          >
            <span
              className={`${
                isMyProfile ? 'border-white' : 'border-black'
              } flex rounded-full border-2`}
            >
              <Avatar str={key} width={28} />
            </span>
          </Link>
        </div>
      </footer>
    </Show>
  );
};

export default Footer;
