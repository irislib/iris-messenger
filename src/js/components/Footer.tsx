import Component from '../BaseComponent';
import iris from 'iris-lib';
import Session from 'iris-lib/src/session';
import Identicon from './Identicon';
import Icons from '../Icons';

const plusIcon = <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z"/></svg>;

type Props = {}

type State = {
    activeRoute: string;
    unseenMsgsTotal: number;
    chatId?: string;
}

class Footer extends Component<Props, State> {
  constructor() {
    super();
    this.state = {unseenMsgsTotal: 0, activeRoute: '/'};
  }

  componentDidMount() {
    iris.local().get('unseenMsgsTotal').on(this.inject());
    iris.local().get('activeRoute').on(this.sub(
      activeRoute => {
        const replaced = activeRoute.replace('/chat/new', '').replace('/chat/', '');
        const chatId = replaced.length < activeRoute.length ? replaced : null;
        this.setState({activeRoute, chatId});
      }
    ));
  }

  render() {
    const key = Session.getPubKey();
    if (!key) { return; }
    const activeRoute = this.state.activeRoute;

    if (this.state.chatId) {
      return '';
    }

    return (
        <footer class="visible-xs-flex nav footer">
          <div class="header-content" onClick={() => iris.local().get('scrollUp').put(true)}>
            <a href="/" class={`btn ${activeRoute === '/' ? 'active' : ''}`}>{Icons.home}</a>
            <a href="/chat" class={`btn ${activeRoute.indexOf('/chat') === 0 ? 'active' : ''}`}>
              {this.state.unseenMsgsTotal ? <span class="unseen unseen-total">{this.state.unseenMsgsTotal}</span>: ''}
              {Icons.chat}
            </a>
            <a href="/post/new" class={`btn ${activeRoute === '/post/new' ? 'active' : ''}`}>{plusIcon}</a>
            <a href="/contacts" class={`btn ${activeRoute === '/contacts' ? 'active' : ''}`}>{Icons.user}</a>
            <a href={`/profile/${key}`} class={`${activeRoute === `/profile/${  key}` ? 'active' : ''} my-profile`}>
              <Identicon str={key} width={34} />
            </a>
          </div>
        </footer>
    );
  }
}

export default Footer;
