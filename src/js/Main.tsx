//import "preact/debug";
import { Helmet } from 'react-helmet';
import { Router, RouterOnChangeArgs } from 'preact-router';

import Footer from './components/Footer';
import Show from './components/helpers/Show';
import MediaPlayer from './components/MediaPlayer';
import Menu from './components/Menu';
import Modal from './components/modal/Modal';
import Session from './nostr/Session';
import { translationLoaded } from './translations/Translation.mjs';
import Helpers from './utils/Helpers.tsx';
import About from './views/About';
import Chat from './views/chat/Chat';
import EditProfile from './views/EditProfile';
import Explorer from './views/explorer/Explorer';
import Global from './views/feeds/Global';
import Home from './views/feeds/Home';
import Notifications from './views/feeds/Notifications';
import SearchFeed from './views/feeds/Search';
import Follows from './views/Follows';
import KeyConverter from './views/KeyConverter';
import Login from './views/Login';
import LogoutConfirmation from './views/LogoutConfirmation';
import Note from './views/Note';
import Profile from './views/Profile';
import Search from './views/Search';
import Settings from './views/settings/Settings';
import Subscribe from './views/Subscribe';
import Torrent from './views/Torrent';
import Component from './BaseComponent';
import localState from './LocalState';

import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '../css/cropper.min.css';

type Props = Record<string, unknown>;

type ReactState = {
  loggedIn: boolean;
  showMenu: boolean;
  unseenMsgsTotal: number;
  activeRoute: string;
  platform: string;
  translationLoaded: boolean;
  showLoginModal: boolean;
};

Session.init({ autologin: false, autofollow: false });

class Main extends Component<Props, ReactState> {
  componentDidMount() {
    window.onload = () => {
      // this makes sure that window.nostr is there
      localState.get('loggedIn').on(this.inject());
    };
    // iris.electron && iris.electron.get('platform').on(this.inject());
    localState.get('unseenMsgsTotal').on(this.inject());
    translationLoaded.then(() => this.setState({ translationLoaded: true }));
    localState.get('showLoginModal').on(this.inject());
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
    const titleTemplate = s.unseenMsgsTotal ? `(${s.unseenMsgsTotal}) %s | iris` : '%s | iris';
    const defaultTitle = s.unseenMsgsTotal ? `(${s.unseenMsgsTotal}) iris` : 'iris';
    if (!s.translationLoaded) {
      return <div />;
    }
    if (!s.loggedIn && window.location.pathname.length <= 1) {
      return <Login fullScreen={true} />;
    }

    // if id begins with "note", it's a post. otherwise it's a profile.
    const NoteOrProfile = (params: { id?: string; path: string }) => {
      if (params.id?.startsWith('note')) {
        return <Note id={params.id} />;
      }
      return <Profile id={params.id} tab="posts" path={params.path} />;
    };

    // TODO /username /username/likes and /username/replies should be under the same component to avoid refresh / rerender between them
    return (
      <div className="flex justify-center">
        <section className="flex w-full max-w-screen-xl justify-between relative">
          <Show when={s.loggedIn}>
            <Menu />
          </Show>
          <Helmet titleTemplate={titleTemplate} defaultTitle={defaultTitle}>
            <title>{title}</title>
            <meta name="description" content="Connecting People" />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content="Connecting People" />
            <meta property="og:image" content="https://iris.to/assets/img/irisconnects.png" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:image" content="https://iris.to/assets/img/irisconnects.png" />
          </Helmet>
          <div className="overlay" onClick={() => this.onClickOverlay()}></div>
          <div className="pb-16 md:pb-0 relative flex h-full flex-grow flex-col w-1/2">
            <Router onChange={(e) => this.handleRoute(e)}>
              <Home path="/" />
              <Search path="/search" focus={true} />
              <KeyConverter path="/key" />
              <Global path="/global" />
              <SearchFeed path="/search/:keyword" />
              <Login path="/login" fullScreen={true} />
              <Notifications path="/notifications" />
              <Chat path="/chat/hashtag/:hashtag?" />
              <Chat path="/chat/:id?" />
              <Note path="/post/:id+" />
              <Torrent path="/torrent/:id+" />
              <About path="/about" />
              <Settings path="/settings/:page?" />
              <LogoutConfirmation path="/logout" />
              <Explorer path="/explorer/:path?" />
              <Explorer path="/explorer/:path+" />
              <EditProfile path="/profile/edit" />
              <Subscribe path="/subscribe" />
              <Profile path="/profile/:id" tab="posts" />
              <Profile path="/:id/replies" tab="replies" />
              <Profile path="/:id/likes" tab="likes" />
              <Follows path="/follows/:id" />
              <Follows followers={true} path="/followers/:id" />
              <NoteOrProfile path="/:id" />
            </Router>
          </div>
          <MediaPlayer />
          <Footer />
        </section>

        <Show when={s.showLoginModal}>
          <Modal
            centerVertically={true}
            showContainer={true}
            onClose={() => localState.get('showLoginModal').put(false)}
          >
            <Login />
          </Modal>
        </Show>
      </div>
    );
  }
}

Helpers.showConsoleWarning();

export default Main;
