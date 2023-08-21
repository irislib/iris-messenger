import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Router, RouterOnChangeArgs } from 'preact-router';

import useLocalState from '@/state/useLocalState.ts';

import Footer from './components/Footer';
import Show from './components/helpers/Show';
import Menu from './components/Menu';
import Modal from './components/modal/Modal';
import localState from './state/LocalState.ts';
import { translationLoaded } from './translations/Translation.mjs';
import Helpers from './utils/Helpers';
import About from './views/About';
import Chat from './views/chat/Chat';
import Global from './views/feeds/Global';
import Home from './views/feeds/Home';
import Notifications from './views/feeds/Notifications';
import SearchFeed from './views/feeds/Search';
import KeyConverter from './views/KeyConverter';
import Login from './views/login/Login.tsx';
import Note from './views/Note';
import EditProfile from './views/profile/EditProfile.tsx';
import Follows from './views/profile/Follows.tsx';
import Profile from './views/profile/Profile.tsx';
import Search from './views/Search';
import LogoutConfirmation from './views/settings/LogoutConfirmation.tsx';
import Settings from './views/settings/Settings';
import Subscribe from './views/Subscribe';

import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '../css/cropper.min.css';

const Main = () => {
  const [loggedIn] = useLocalState('loggedIn', false);
  const [unseenMsgsTotal] = useLocalState('unseenMsgsTotal', 0);
  const [activeRoute, setActiveRoute] = useLocalState('activeRoute', '');
  const [translationsLoadedState, setTranslationsLoadedState] = useLocalState(
    'translationsLoaded',
    false,
  );
  const [showLoginModal] = useLocalState('showLoginModal', false);

  useEffect(() => {
    translationLoaded.then(() => {
      setTranslationsLoadedState(true);
    });
  }, []);

  const handleRoute = (e: RouterOnChangeArgs) => {
    const currentActiveRoute = e.url;
    setActiveRoute(currentActiveRoute);
    localState.get('activeRoute').put(currentActiveRoute);
  };

  let title = '';
  if (activeRoute && activeRoute.length > 1) {
    title = Helpers.capitalize(activeRoute.replace('/', '').split('?')[0]);
  }
  const titleTemplate = unseenMsgsTotal ? `(${unseenMsgsTotal}) %s | iris` : '%s | iris';
  const defaultTitle = unseenMsgsTotal ? `(${unseenMsgsTotal}) iris` : 'iris';

  if (!translationsLoadedState) {
    return <div />;
  }

  if (!loggedIn && window.location.pathname.length <= 1) {
    return <Login fullScreen={true} />;
  }

  const NoteOrProfile = (params: { id?: string; path: string }) => {
    if (params.id?.startsWith('note')) {
      return <Note id={params.id} />;
    }
    return <Profile id={params.id} tab="posts" path={params.path} />;
  };

  return (
    <div className="flex justify-center">
      <section className="flex w-full max-w-screen-xl justify-between relative">
        <Show when={loggedIn}>
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
        <div className="pb-16 md:pb-0 relative flex h-full flex-grow flex-col w-1/2">
          <Router onChange={(e) => handleRoute(e)}>
            <Home path="/" />
            <Search path="/search" focus={true} />
            <KeyConverter path="/key" />
            <Global path="/global" />
            <SearchFeed path="/search/:keyword" />
            <Login path="/login" fullScreen={true} />
            <Notifications path="/notifications" />
            <Chat path="/chat/:id?" />
            <Note path="/post/:id+" />
            <About path="/about" />
            <Settings path="/settings/:page?" />
            <LogoutConfirmation path="/logout" />
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
        <Footer />
      </section>

      <Show when={showLoginModal}>
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
};

export default Main;
