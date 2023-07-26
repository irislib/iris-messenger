import $ from 'jquery';

import BaseComponent from '../../BaseComponent';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import { translate as t } from '../../translations/Translation.mjs';

import ChatListItem from './ChatListItem';

interface ChatListProps {
  activeChat?: string;
  className?: string;
}

interface ChatListState {
  chats: Map<string, any>;
  sortedChats: Array<string>;
}

class ChatList extends BaseComponent<ChatListProps, ChatListState> {
  constructor(props: ChatListProps) {
    super(props);
    this.state = {
      chats: new Map(),
      sortedChats: [],
    };
  }

  enableDesktopNotifications() {
    if (window.Notification) {
      Notification.requestPermission(() => {
        if (Notification.permission === 'granted' || Notification.permission === 'denied') {
          $('#enable-notifications-prompt').slideUp();
        }
        if (Notification.permission === 'granted') {
          // TODO subscribe to web push
        }
      });
    }
  }

  componentDidMount() {
    Events.getDirectMessages((chats: Map<string, any>) => {
      const sortedChats: string[] = Array.from(chats.keys()).sort((a: string, b: string) => {
        const aEventIds: any[] = chats.get(a).eventIds;
        const bEventIds: any[] = chats.get(b).eventIds;
        const aLatestEvent: any = aEventIds.length ? Events.db.by('id', aEventIds[0]) : null;
        const bLatestEvent: any = bEventIds.length ? Events.db.by('id', bEventIds[0]) : null;
        if (bLatestEvent?.created_at > aLatestEvent?.created_at) {
          return 1;
        } else if (bLatestEvent?.created_at < aLatestEvent?.created_at) {
          return -1;
        }
        return 0;
      });
      this.setState({ chats, sortedChats });
    });

    localState.get('scrollUp').on(this.sub(() => window.scrollTo(0, 0)));

    if (
      window.Notification &&
      Notification.permission !== 'granted' &&
      Notification.permission !== 'denied'
    ) {
      // setTimeout logic here, currently commented out.
    }
  }

  render() {
    const activeChat = this.props.activeChat;

    return (
      <section
        className={`h-screen overflow-x-hidden overflow-y-scroll px-4 md:px-0 w-full md:w-64 ${
          this.props.className || ''
        }`}
      >
        <div
          id="enable-notifications-prompt"
          className="hidden"
          onClick={() => this.enableDesktopNotifications()}
        >
          <div className="title">{t('get_notified_new_messages')}</div>
          <div>
            <a>{t('turn_on_desktop_notifications')}</a>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {this.state.sortedChats.map((pubkey) => (
            <ChatListItem
              active={pubkey === activeChat}
              key={pubkey}
              chat={pubkey}
              latestMsgId={this.state.chats.get(pubkey).eventIds[0]}
            />
          ))}
        </div>
      </section>
    );
  }
}

export default ChatList;
