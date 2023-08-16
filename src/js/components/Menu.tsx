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
import Icons from '../utils/Icons.tsx';

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

  // const renderMenuItem = (a) => {
  //   const isActive = a.url === activeRoute;
  //   const Icon = isActive ? a.activeIcon : a.icon;
  //   return (
  //     <div>
  //       <a
  //         onClick={(e) => menuLinkClicked(e, a)}
  //         className={`${
  //           isActive ? 'active' : ''
  //         } inline-flex w-auto flex items-center space-x-4 p-3 rounded-full transition-colors duration-200 hover:bg-neutral-900`}
  //         href={a.url}
  //       >
  //         <img src="/img/dwotr/logo30.png" style="padding-top:5px" />
  //         <h1 className="hidden xl:flex text-3xl">Dpeep</h1>
  //       </a>
  //       <a href="https://github.com/DigitalTrustProtocol/DWoTR-Documentation/blob/main/Trust.md" target="_blank"><small className="pl-3">Iris clone with DWoTR</small></a>
  //       {APPLICATIONS.map((a: any) => {
  //         if (a.url && (!a.beta || this.state.showBetaFeatures)) {
  //           let isActive = this.state.activeRoute.startsWith(a.url);
  //           if (a.url === '/') {
  //             isActive = this.state.activeRoute.length <= 1;
  //           }
  //           const Icon = isActive ? a.activeIcon : a.icon;
  //           return (
  //             <div>
  //               <a
  //                 onClick={(e) => this.menuLinkClicked(e, a)}
  //                 className={`${
  //                   isActive ? 'active' : ''
  //                 } inline-flex w-auto flex items-center space-x-4 p-3 rounded-full transition-colors duration-200 hover:bg-neutral-900`}
  //                 href={a.url}
  //               >
  //                 {a.text === 'messages' && this.state.unseenMsgsTotal ? (
  //                   <span class="unseen unseen-total">{this.state.unseenMsgsTotal}</span>
  //                 ) : (
  //                   ''
  //                 )}
  //                 <Icon width={24} />
  //                 <span className="hidden xl:flex">{t(a.text)}</span>
  //               </a>
  //             </div>
  //           );
  //         }
  //       })}
  //       <hr className="-mx-2 opacity-10 my-2" />
  //       <div class="py-2">
  //         <button
  //           className="btn btn-primary md:max-xl:btn-circle"
  //           onClick={() => this.setState({ showNewPostModal: !this.state.showNewPostModal })}
  //         >
  //           <PlusIcon width={24} />
  //           <span className="hidden xl:flex">{t('new_post')}</span>
  //         </button>
  //         {this.renderNewPostModal()}
  //       </div>
  //       <hr className="-mx-2 opacity-10 my-2" />
  //       {this.renderProfileLink()}
  //         <Show when={a.text === 'messages' && unseenMsgsTotal}>
  //           <span class="unseen unseen-total">{unseenMsgsTotal}</span>
  //         </Show>
  //         <Icon width={24} />
  //         <span className="hidden xl:flex">{t(a.text)}</span>
  //       </a>
  //     </div>
  //   );
  // };

  return (
    <div className="sticky border-r border-neutral-900 top-0 z-20 h-screen max-h-screen hidden md:flex xl:w-56 flex-col px-2 py-4 flex-shrink-0">
      <a
        className="flex items-center gap-3 px-2 mb-4"
        tabIndex={3}
        href="/"
        onClick={() => menuLinkClicked()}
      >
        <img src="/img/dwotr/logo30.png" width="30" height="30" />
        <h1 className="hidden xl:flex text-3xl">Dpeep</h1>
      </a>
      <a href="https://github.com/DigitalTrustProtocol/DWoTR-Documentation/blob/main/Trust.md" target="_blank"><small className="pl-3">Iris clone with DWoTR</small></a>
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
      <hr className="-mx-2 opacity-10 my-2" />
      {renderProfileLink()}
    </div>
  );
}
