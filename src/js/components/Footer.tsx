import { HomeIcon, PaperAirplaneIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconFull,
  PaperAirplaneIcon as PaperAirplaneIconFull,
  PlusCircleIcon as PlusCircleIconFull,
} from '@heroicons/react/24/solid';
import { route } from 'preact-router';

import Component from '../BaseComponent';
import localState from '../LocalState';
import Key from '../nostr/Key';

import Identicon from './Identicon';

type Props = Record<string, unknown>;

type State = {
  activeRoute: string;
  unseenMsgsTotal: number;
  chatId?: string;
};

class Footer extends Component<Props, State> {
  constructor() {
    super();
    this.state = { unseenMsgsTotal: 0, activeRoute: '/' };
  }

  componentDidMount() {
    localState.get('unseenMsgsTotal').on(this.inject());
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

  render() {
    const key = Key.toNostrBech32Address(Key.getPubKey(), 'npub');
    if (!key) {
      return;
    }
    const activeRoute = this.state.activeRoute;

    if (this.state.chatId) {
      return '';
    }

    return (
      <footer className="fixed md:hidden bottom-0 z-10 w-full bg-base-200 pb-safe-area">
        <div onClick={() => localState.get('scrollUp').put(true)} className="flex">
          <a
            href="/"
            onClick={(e) => this.handleFeedClick(e)}
            className={`btn flex flex-grow ${activeRoute === '/' ? 'active' : ''}`}
          >
            {activeRoute === '/' ? <HomeIconFull width={24} /> : <HomeIcon width={24} />}
          </a>
          <a
            href="/chat"
            className={`btn flex-grow ${activeRoute.indexOf('/chat') === 0 ? 'active' : ''}`}
          >
            {this.state.unseenMsgsTotal ? (
              <span className="unseen unseen-total">{this.state.unseenMsgsTotal}</span>
            ) : (
              ''
            )}
            {activeRoute.indexOf('/chat') === 0 ? (
              <PaperAirplaneIconFull width={24} />
            ) : (
              <PaperAirplaneIcon width={24} />
            )}
          </a>
          <a
            href="/post/new"
            className={`btn flex flex-grow ${activeRoute === '/post/new' ? 'active' : ''}`}
          >
            {activeRoute === '/post/new' ? (
              <PlusCircleIconFull width={24} />
            ) : (
              <PlusCircleIcon width={24} />
            )}
          </a>
          <a
            href={`/${key}`}
            className={`${activeRoute === `/${key}` ? 'active' : ''} btn flex flex-grow`}
          >
            <Identicon str={key} width={34} />
          </a>
        </div>
      </footer>
    );
  }
}

export default Footer;
