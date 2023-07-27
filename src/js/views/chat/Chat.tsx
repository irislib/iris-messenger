import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

import Show from '../../components/helpers/Show';
import { translate as t } from '../../translations/Translation.mjs';
import View from '../View';

import ChatList from './ChatList';
import PrivateChat from './PrivateChat';

class Chat extends View {
  id: string;

  constructor() {
    super();
    this.id = 'chat-view';
    this.hideSideBar = true;
  }

  renderView() {
    return (
      <div className="flex flex-row">
        <ChatList
          activeChat={this.props.id}
          className={this.props.id ? 'hidden md:flex' : 'flex'}
        />
        <Show when={this.props.id}>
          <PrivateChat id={this.props.id} key={this.props.id} />
        </Show>
        <Show when={!this.props.id}>
          <div className="hidden md:flex flex-col items-center justify-center flex-1">
            <div className="my-4">
              <PaperAirplaneIcon className="w-24 h-24 text-neutral-400" />
            </div>
            <div className="text-neutral-400">{t('dm_privacy_warning')}</div>
          </div>
        </Show>
      </div>
    );
  }
}

export default Chat;
