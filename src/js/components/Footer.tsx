import iris from 'iris-lib';

import Component from '../BaseComponent';
import Icons from '../Icons';

import Identicon from './Identicon';

const plusIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z"
    />
  </svg>
);

type Props = Record<string, unknown>;

type State = {
  activeRoute: string;
  unseenMsgsTotal: number;
  showBetaFeatures: boolean;
  chatId?: string;
};

class Footer extends Component<Props, State> {
  constructor() {
    super();
    this.state = { showBetaFeatures: false, unseenMsgsTotal: 0, activeRoute: '/' };
  }

  componentDidMount() {
    iris.local().get('unseenMsgsTotal').on(this.inject());
    iris.local().get('settings').get('showBetaFeatures').on(this.inject());
    iris
      .local()
      .get('activeRoute')
      .on(
        this.sub((activeRoute) => {
          const replaced = activeRoute.replace('/chat/new', '').replace('/chat/', '');
          const chatId = replaced.length < activeRoute.length ? replaced : null;
          this.setState({ activeRoute, chatId });
        }),
      );
  }

  render() {
    const key = iris.session.getPubKey();
    if (!key) {
      return;
    }
    const activeRoute = this.state.activeRoute;

    if (this.state.chatId) {
      return '';
    }

    return (
      <footer class="visible-xs-flex nav footer">
        <div class="header-content" onClick={() => iris.local().get('scrollUp').put(true)}>
          <a href="/" class={`btn ${activeRoute === '/' ? 'active' : ''}`}>
            {Icons.home}
          </a>
          {this.state.showBetaFeatures && (
            <a href="/chat" className={`btn ${activeRoute.indexOf('/chat') === 0 ? 'active' : ''}`}>
              {this.state.unseenMsgsTotal ? (
                <span class="unseen unseen-total">{this.state.unseenMsgsTotal}</span>
              ) : (
                ''
              )}
              {Icons.chat}
            </a>
          )}
          <a href="/post/new" class={`btn ${activeRoute === '/post/new' ? 'active' : ''}`}>
            {plusIcon}
          </a>
          <a href="/discover" class={`btn ${activeRoute === '/discover' ? 'active' : ''}`}>
            {Icons.search}
          </a>
          <a
            href={`/profile/${key}`}
            class={`${activeRoute === `/profile/${key}` ? 'active' : ''} my-profile`}
          >
            <Identicon str={key} width={34} />
          </a>
        </div>
      </footer>
    );
  }
}

export default Footer;
