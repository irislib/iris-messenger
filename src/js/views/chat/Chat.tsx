import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation.mjs';
import View from '../View';

import ChatList from './ChatList';
import ChatMessages from './ChatMessages';
import Header from './Header';
import NewChat, { addChatWithInputKey } from './NewChat';

class Chat extends View {
  id: string;

  constructor() {
    super();
    this.id = 'chat-view';
    this.hideSideBar = true;
    this.hideHeader = true;
  }

  componentDidMount() {
    super.componentDidMount();
    const id = window.location.hash.substr(1);
    if (id && id.startsWith('nsec')) {
      window.history.replaceState({}, document.title, window.location.pathname);
      if (!Key.getPubKey()) {
        Key.loginAsNewUser();
      }
      addChatWithInputKey(id);
    }
  }

  renderContent = (id) => {
    if (id === 'new') {
      return <NewChat />;
    } else if (id) {
      return <ChatMessages id={id} key={id} />;
    } else {
      return (
        <div className="hidden md:flex flex-col items-center justify-center flex-1">
          <div className="my-4">
            <PaperAirplaneIcon className="w-24 h-24 text-neutral-400" />
          </div>
          <div className="text-neutral-400">{t('dm_privacy_warning')}</div>
        </div>
      );
    }
  };

  renderView() {
    const { id } = this.props;

    return (
      <div className="flex flex-col h-full max-h-screen">
        <Header key={id} activeChat={id} />
        <div className="flex flex-row flex-grow overflow-hidden">
          <div
            className={`flex-shrink-0 ${
              id ? 'hidden md:flex overflow-y-auto' : 'flex overflow-y-auto'
            }`}
          >
            <ChatList activeChat={id} className={id ? 'hidden md:flex' : 'flex'} />
          </div>
          <div
            key={`chat-content-${id}`}
            className={`flex-grow overflow-y-auto ${!id ? 'hidden md:flex' : 'flex'}`}
          >
            {this.renderContent(id)}
          </div>
        </div>
      </div>
    );
  }
}

export default Chat;
