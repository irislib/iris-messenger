//import "preact/debug";
import { Helmet } from 'react-helmet';
import { Router, RouterOnChangeArgs } from 'preact-router';

import Footer from './components/Footer';
import MediaPlayer from './components/MediaPlayer';
import Menu from './components/Menu';
import Session from './nostr/Session';
import { translationLoaded } from './translations/Translation';
import About from './views/About';
import Chat from './views/chat/Chat';
import EditProfile from './views/EditProfile';
import Explorer from './views/explorer/Explorer';
import Feed from './views/Feed';
import FeedList from './views/FeedList';
import Follows from './views/Follows';
import KeyConverter from './views/KeyConverter';
import Login from './views/Login';
import LogoutConfirmation from './views/LogoutConfirmation';
import Note from './views/Note';
import Notifications from './views/Notifications';
import Profile from './views/Profile';
import Settings from './views/settings/Settings';
import Torrent from './views/Torrent';
import Component from './BaseComponent';
import Helpers from './Helpers';
import localState from './LocalState';

import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '../css/style.css';
import '../css/cropper.min.css';

type Props = Record<string, unknown>;

type ReactState = {
  loggedIn: boolean;
  showMenu: boolean;
  unseenMsgsTotal: number;
  activeRoute: string;
  platform: string;
  translationLoaded: boolean;
};

Session.init({ autologin: window.location.pathname.length > 1, autofollow: false });

class Main extends Component<Props, ReactState> {
  componentDidMount() {
    // if location contains a hash #, redirect to the same url without the hash. For example #/profile -> /profile
    if (window.location.hash.length) {
      window.location.href = window.location.origin + window.location.hash.replace('#', '');
    }
    window.onload = () => {
      // this makes sure that window.nostr is there
      localState.get('loggedIn').on(this.inject());
    };
    localState.get('toggleMenu').put(false);
    localState.get('toggleMenu').on((show: boolean) => this.toggleMenu(show));
    // iris.electron && iris.electron.get('platform').on(this.inject());
    localState.get('unseenMsgsTotal').on(this.inject());
    translationLoaded.then(() => this.setState({ translationLoaded: true }));
  }

  handleRoute(e: RouterOnChangeArgs) {
    const activeRoute = e.url;
    this.setState({ activeRoute });
    localState.get('activeRoute').put(activeRoute);
  }

  onClickOverlay(): void {
    if (this.state.showMenu) {
      this.setState({ showMenu: false });
    }
  }

  toggleMenu(show: boolean): void {
    this.setState({
      showMenu: typeof show === 'undefined' ? !this.state.showMenu : show,
    });
  }

  electronCmd(name: string): void {
    console.log(name); // disable lint error
    // iris.electron.get('cmd').put({ name, time: new Date().toISOString() });
  }

  render() {
    let title = '';
    const s = this.state;
    if (s.activeRoute && s.activeRoute.length > 1) {
      title = Helpers.capitalize(s.activeRoute.replace('/', '').split('?')[0]);
    }
    const isDesktopNonMac = s.platform && s.platform !== 'darwin';
    const titleTemplate = s.unseenMsgsTotal ? `(${s.unseenMsgsTotal}) %s | iris` : '%s | iris';
    const defaultTitle = s.unseenMsgsTotal ? `(${s.unseenMsgsTotal}) iris` : 'iris';
    if (!s.translationLoaded) {
      return <div id="main-content" />;
    }
    if (!s.loggedIn && window.location.pathname.length > 2) {
      return <div id="main-content" />;
    }
    if (!s.loggedIn) {
      return (
        <div id="main-content">
          <Login />
        </div>
      );
    }

    // hack to remount profile on route change. Problem: also remounts on tab change
    const MyProfile = (params: { id?: string; tab: string; path: string }) => (
      <Profile path={params.path} id={params.id} key={params.id} tab={params.tab} />
    );
    // if id begins with "note", it's a post. otherwise it's a profile.
    const NoteOrProfile = (params: { id?: string; path: string }) => {
      if (params.id.startsWith('note')) {
        return <Note id={params.id} />;
      }
      return <MyProfile id={params.id} tab="posts" path={params.path} />;
    };

    return (
      <div id="main-content">
        {isDesktopNonMac ? (
          <div className="windows-titlebar">
            <span>iris</span>
            <div className="title-bar-btns">
              <button className="min-btn" onClick={() => this.electronCmd('minimize')}>
                -
              </button>
              <button className="max-btn" onClick={() => this.electronCmd('maximize')}>
                +
              </button>
              <button className="close-btn" onClick={() => this.electronCmd('close')}>
                x
              </button>
            </div>
          </div>
        ) : null}
        <section
          className={`main ${isDesktopNonMac ? 'desktop-non-mac' : ''} ${
            s.showMenu ? 'menu-visible-xs' : ''
          }`}
          style="flex-direction: row;"
        >
          <Menu />
          <Helmet titleTemplate={titleTemplate} defaultTitle={defaultTitle}>
            <title>{title}</title>
            <meta name="description" content="Social Networking Freedom" />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content="Social Networking Freedom" />
            <meta property="og:image" content="https://iris.to/assets/img/irisconnects.png" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:image" content="https://iris.to/assets/img/irisconnects.png" />
          </Helmet>
          <div className="overlay" onClick={() => this.onClickOverlay()}></div>
          <div className="view-area">
            <Router onChange={(e) => this.handleRoute(e)}>
              <FeedList path="/" />
              <KeyConverter path="/key" />
              <Feed path="/following" index="follows" />
              <Feed path="/global" index="global" />
              <Feed path="/search/:keyword?" />
              <Login path="/login" />
              <Notifications path="/notifications" />
              <Chat path="/chat/hashtag/:hashtag?" />
              <Chat path="/chat/:id?" />
              <Chat path="/chat/new/:id" />
              <Note path="/post/:id+" />
              <Torrent path="/torrent/:id+" />
              <About path="/about" />
              <Settings path="/settings/:page?" />
              <LogoutConfirmation path="/logout" />
              <Explorer path="/explorer/:path?" />
              <Explorer path="/explorer/:path+" />
              <EditProfile path="/profile/edit" />
              <MyProfile path="/profile/:id+" tab="profile" />
              <MyProfile path="/replies/:id+" tab="replies" />
              <MyProfile path="/likes/:id+" tab="likes" />
              <MyProfile path="/media/:id+" tab="media" />
              <Follows path="/follows/:id" />
              <Follows followers={true} path="/followers/:id" />
              <NoteOrProfile path="/:id+" />
            </Router>
          </div>
        </section>
        <MediaPlayer />
        <Footer />
      </div>
    );
  }
}

Helpers.showConsoleWarning();

export default Main;
