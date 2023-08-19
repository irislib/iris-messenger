import { useEffect, useMemo, useState } from 'react';
import {
  Cog8ToothIcon,
  HomeIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import {
  Cog8ToothIcon as Cog8ToothIconFull,
  HomeIcon as HomeIconFull,
  InformationCircleIcon as InformationCircleIconFull,
  MagnifyingGlassIcon,
  PaperAirplaneIcon as PaperAirplaneIconFull,
  PlusIcon,
} from '@heroicons/react/24/solid';
import { Link } from 'preact-router';

import CreateNoteForm from '@/components/create/CreateNoteForm';

import localState from '../LocalState';
import Key from '../nostr/Key';
import { translate as t } from '../translations/Translation.mjs';
import Icons from '../utils/Icons';

import Show from './helpers/Show';
import Modal from './modal/Modal';
import Avatar from './user/Avatar';
import Name from './user/Name';

const MENU_ITEMS = [
  { url: '/', text: 'home', icon: HomeIcon, activeIcon: HomeIconFull },
  {
    url: '/search',
    text: 'search',
    icon: MagnifyingGlassIcon,
    activeIcon: Icons.magnifyingGlassBold,
  },
  {
    url: '/chat',
    text: 'messages',
    icon: PaperAirplaneIcon,
    activeIcon: PaperAirplaneIconFull,
  },
  {
    url: '/settings',
    text: 'settings',
    icon: Cog8ToothIcon,
    activeIcon: Cog8ToothIconFull,
  },
  {
    url: '/about',
    text: 'about',
    icon: InformationCircleIcon,
    activeIcon: InformationCircleIconFull,
  },
];

export default function Menu() {
  const [unseenMsgsTotal, setUnseenMsgsTotal] = useState(0);
  const [activeRoute, setActiveRoute] = useState('');
  const [showNewPostModal, setShowNewPostModal] = useState(false);

  useEffect(() => {
    const unsubscribeUnseenMsgsTotal = localState.get('unseenMsgsTotal').on(setUnseenMsgsTotal);
    const unsubscribeActiveRoute = localState.get('activeRoute').on(setActiveRoute);
    return () => {
      unsubscribeUnseenMsgsTotal();
      unsubscribeActiveRoute();
    };
  }, []);

  const isStPatricksDay = useMemo(() => {
    const today = new Date();
    return today.getMonth() === 2 && today.getDate() === 17;
  }, []);

  const menuLinkClicked = () => {
    localState.get('scrollUp').put(true);
    window.scrollTo(0, 0);
  };

  const renderNewPostModal = () => (
    <Modal centerVertically={true} showContainer={true} onClose={() => setShowNewPostModal(false)}>
      <CreateNoteForm
        onSubmit={() => setShowNewPostModal(false)}
        placeholder={t('whats_on_your_mind')}
        autofocus={true}
      />
    </Modal>
  );

  const renderProfileLink = () => {
    const hex = Key.getPubKey();
    const npub = Key.toNostrBech32Address(hex, 'npub');
    return (
      <div className="flex justify-center xl:justify-start">
        <Link href={`/${npub}`} className="btn btn-ghost md:max-xl:btn-circle">
          <Avatar str={hex} width={34} />
          <div className="hidden xl:block ml-2">
            <Name pub={hex} hideBadge={true} />
          </div>
        </Link>
      </div>
    );
  };

  const renderMenuItem = (a) => {
    const isActive = new RegExp(`^${a.url}(/|$)`).test(activeRoute);
    const Icon = isActive ? a.activeIcon : a.icon;
    return (
      <div>
        <a
          onClick={() => menuLinkClicked()}
          className={`${
            isActive ? 'active' : ''
          } inline-flex w-auto flex items-center space-x-4 p-3 rounded-full transition-colors duration-200 hover:bg-neutral-900`}
          href={a.url}
        >
          <Show when={a.text === 'messages' && unseenMsgsTotal}>
            <span class="unseen unseen-total">{unseenMsgsTotal}</span>
          </Show>
          <Icon width={26} />
          <span className="hidden xl:flex pr-2">{t(a.text)}</span>
        </a>
      </div>
    );
  };

  return (
    <div className="sticky border-r border-neutral-900 top-0 z-20 h-screen max-h-screen hidden md:flex xl:w-56 flex-col px-2 py-4 flex-shrink-0">
      <a
        className="flex items-center gap-3 px-2 mb-4"
        tabIndex={3}
        href="/"
        onClick={() => menuLinkClicked()}
      >
        {isStPatricksDay ? (
          <span className="text-3xl">☘️</span>
        ) : (
          <img src="/img/icon128.png" width="34" height="34" />
        )}
        <h1 className="hidden xl:flex text-3xl">iris{isStPatricksDay ? 'h' : ''}</h1>
      </a>
      <div className="flex flex-col gap-2">{MENU_ITEMS.map((a: any) => renderMenuItem(a))}</div>
      <div class="py-2 flex-1">
        <button
          className="btn btn-primary md:max-xl:btn-circle mt-2"
          onClick={() => setShowNewPostModal(!showNewPostModal)}
        >
          <PlusIcon width={26} />
          <span className="hidden xl:flex">{t('new_post')}</span>
        </button>
        <Show when={showNewPostModal}>{renderNewPostModal()}</Show>
      </div>
      {renderProfileLink()}
    </div>
  );
}
