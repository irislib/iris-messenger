import { HomeIcon, PaperAirplaneIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconFull,
  MagnifyingGlassIcon,
  PaperAirplaneIcon as PaperAirplaneIconFull,
  PlusCircleIcon as PlusCircleIconFull,
} from '@heroicons/react/24/solid';
import { route } from 'preact-router';

import Component from '../BaseComponent';
import Icons from '../Icons';
import localState from '../LocalState';
import Key from '../nostr/Key';

import Avatar from './Avatar';
import Show from './Show';

type Props = Record<string, unknown>;

type State = {
  activeRoute: string;
  unseenMsgsTotal: number;
  chatId?: string;
  isMyProfile?: boolean;
};

class Footer extends Component<Props, State> {
  constructor() {
    super();
    this.state = { unseenMsgsTotal: 0, activeRoute: '/' };
  }

  componentDidMount() {
    localState.get('unseenMsgsTotal').on(this.inject());
    localState.get('isMyProfile').on(this.inject());
    localState.get('activeRoute').on(
      this.sub((activeRoute) => {
        const replaced = activeRoute.replace('/chat/new', '').replace('/chat/', '');
        const chatId = replaced.length < activeRoute.length ? replaced : null;
        this.setState({ activeRoute, chatId });
      }),
    );
  }

  handleFeedClick(e) {
    e.preventDefault();
    e.stopPropagation();
    localState.get('lastOpenedFeed').once((lastOpenedFeed) => {
      if (lastOpenedFeed !== this.state.activeRoute.replace('/', '')) {
        route('/' + (lastOpenedFeed || ''));
      } else {
        localState.get('lastOpenedFeed').put('');
        route('/');
      }
    });
  }

  renderButton(href, icon, iconActive) {
    const isActive = new RegExp(`^${href}(/|$)`).test(this.state.activeRoute);
    return (
      <a href={href} className={`btn flex-grow ${isActive ? 'active' : ''}`}>
        <Show when={isActive}>{iconActive}</Show>
        <Show when={!isActive}>{icon}</Show>
      </a>
    );
  }

  render() {
    const key = Key.toNostrBech32Address(Key.getPubKey(), 'npub');
    if (!key) {
      return;
    }

    if (this.state.chatId) {
      return '';
    }

    return (
      <footer className="fixed md:hidden bottom-0 z-10 w-full bg-base-200 pb-safe-area">
        <div onClick={() => localState.get('scrollUp').put(true)} className="flex">
          {this.renderButton('/', <HomeIcon width={24} />, <HomeIconFull width={24} />)}
          {this.renderButton(
            '/chat',
            <PaperAirplaneIcon width={24} />,
            <PaperAirplaneIconFull width={24} />,
          )}
          {this.renderButton(
            '/post/new',
            <PlusCircleIcon width={24} />,
            <PlusCircleIconFull width={24} />,
          )}
          {this.renderButton(
            '/search',
            <MagnifyingGlassIcon width={24} />,
            <Icons.magnifyingGlassBold width={24} />,
          )}
          <a href={`/${key}`} className="rounded-full btn flex flex-grow">
            <span
              className={`${
                this.state.isMyProfile ? 'border-white' : 'border-black'
              } flex rounded-full border-2`}
            >
              <Avatar str={key} width={28} />
            </span>
          </a>
        </div>
      </footer>
    );
  }
}

export default Footer;
