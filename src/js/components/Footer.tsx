import Component from '../BaseComponent';
import Icons from '../Icons';
import localState from '../LocalState';
import Key from '../nostr/Key';
import Nostr from '../nostr/Nostr';

import Identicon from './Identicon';

const plusIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <circle class="nav-plus-bg" cx="12" cy="12" r="12" />
    <path
      fill="#FFFFFF"
      d="M12,21.1c-0.4,0-0.7-0.3-0.7-0.7V3.7C11.3,3.3,11.6,3,12,3s0.7,0.3,0.7,0.7v16.7C12.7,20.7,12.4,21.1,12,21.1z"
    />
    <path
      fill="#FFFFFF"
      d="M20.3,12.7H3.7C3.3,12.7,3,12.4,3,12s0.3-0.7,0.7-0.7h16.7c0.4,0,0.7,0.3,0.7,0.7S20.7,12.7,20.3,12.7z"
    />
  </svg>
);

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

  render() {
    const key = Nostr.toNostrBech32Address(Key.getPubKey(), 'npub');
    if (!key) {
      return;
    }
    const activeRoute = this.state.activeRoute;

    if (this.state.chatId) {
      return '';
    }

    return (
      <footer class="visible-xs-flex nav footer">
        <div class="header-content" onClick={() => localState.get('scrollUp').put(true)}>
          <a href="/" class={`btn ${activeRoute === '/' ? 'active' : ''}`}>
            {Icons.home}
          </a>
          <a href="/chat" className={`btn ${activeRoute.indexOf('/chat') === 0 ? 'active' : ''}`}>
            {this.state.unseenMsgsTotal ? (
              <span className="unseen unseen-total">{this.state.unseenMsgsTotal}</span>
            ) : (
              ''
            )}
            {Icons.chat}
          </a>
          <a href="/post/new" class={`btn ${activeRoute === '/post/new' ? 'active' : ''}`}>
            {plusIcon}
          </a>
          <a href="/global" class={`btn ${activeRoute === '/global' ? 'active' : ''}`}>
            {Icons.global}
          </a>
          <a href={`/${key}`} class={`${activeRoute === `/${key}` ? 'active' : ''} my-profile`}>
            <Identicon str={key} width={34} />
          </a>
        </div>
      </footer>
    );
  }
}

export default Footer;
