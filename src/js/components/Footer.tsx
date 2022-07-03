import Component from '../BaseComponent';
import State from '../State';
import Session from '../Session';
import Identicon from './Identicon';
import Icons from '../Icons';

const plusIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z"/>
  </svg>
);

type Props = {};

type State = {
  unseenMsgsTotal: number;
  activeRoute: string;
  latest: Object;
}

class Footer extends Component<Props, State> {
  chatId: string;
  activeRoute: string;

  constructor() {
    super();
    this.state = {
      latest: {},
      unseenMsgsTotal: undefined,
      activeRoute: undefined,
    };
    this.chatId = null;
  }

  componentDidMount() {
    State.local.get('unseenMsgsTotal').on(this.inject());
    State.local.get('activeRoute').on(this.sub(
      (activeRoute: string) => {
        this.setState({activeRoute});
        const replaced = activeRoute.replace('/chat/new', '').replace('/chat/', '');
        this.chatId = replaced.length < activeRoute.length ? replaced : null;
      }
    ));
  }

  render() {
    const key = Session.getPubKey();
    if (!key) { return; }
    const activeRoute = this.state.activeRoute;

    if (this.chatId) {
      return null;
    }

    return (
      <footer className="visible-xs-flex nav footer">
        <div className="header-content" onClick={() => State.local.get('scrollUp').put(true)}>
          <a href="/" className={`btn ${activeRoute && activeRoute === '/' ? 'active' : ''}`}>{Icons.home}</a>
          <a href="/chat" className="btn ${activeRoute && activeRoute.indexOf('/chat') === 0 ? 'active' : ''}">
            {this.state.unseenMsgsTotal ? <span className="unseen unseen-total">{this.state.unseenMsgsTotal}</span> : null}
            {Icons.chat}
          </a>
          <a href="/post/new" className="btn ${activeRoute && activeRoute === '/post/new' ? 'active' : ''}">{plusIcon}</a>
          <a href="/contacts" className="btn ${activeRoute && activeRoute === '/contacts' ? 'active' : ''}">{Icons.user}</a>
          <a href={`/profile/${key}`} className={`${activeRoute && activeRoute === `/profile/${key}` ? 'active' : ''} my-profile}`}>
            <Identicon str={key} width={34} />
          </a>
        </div>
      </footer>
    );
  }
}

export default Footer;
