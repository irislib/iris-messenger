import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation.mjs';
import View from '../View';

import ChatList from './ChatList';
import ChatMessages from './ChatMessages';
import NewChat, { addChatWithInputKey } from './NewChat';

class Chat extends View {
  id: string;

  constructor() {
    super();
    this.id = 'chat-view';
    this.hideSideBar = true;
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
      <div className="flex flex-row h-full">
        <ChatList activeChat={id} className={id ? 'hidden md:flex' : 'flex'} />
        {this.renderContent(id)}
      </div>
    );
  }
}

export default Chat;
