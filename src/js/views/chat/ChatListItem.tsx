import { route } from 'preact-router';

import BaseComponent from '../../BaseComponent';
import Avatar from '../../components/user/Avatar';
import Name from '../../components/user/Name';
import Helpers from '../../Helpers';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Session from '../../nostr/Session';

interface ChatListItemProps {
  chat: string;
  active?: boolean;
  latestMsgId?: string;
}

interface ChatListItemState {
  latest: any;
  latestText: string;
  lastOpened: number;
}

class ChatListItem extends BaseComponent<ChatListItemProps, ChatListItemState> {
  constructor() {
    super();
    this.state = {
      latest: {},
      latestText: '',
      lastOpened: -Infinity,
    };
  }

  onKeyUp(e: KeyboardEvent) {
    // if enter was pressed, click the element
    if (e.keyCode === 13) {
      (e.target as HTMLElement).click();
    }
  }

  getLatestMsg() {
    if (!this.props.latestMsgId) {
      return;
    }
    const event = Events.db.by('id', this.props.latestMsgId);
    if (event) {
      this.setState({ latest: event });
      Key.decryptMessage(this.props.latestMsgId, (latestText: string) => {
        this.setState({ latestText });
      });
    }
  }

  componentDidMount() {
    this.getLatestMsg();
    const path = 'chats/' + this.props.chat + '/lastOpened';
    Session.public?.get(path, (lastOpened: number) => {
      this.setState({ lastOpened });
    });
  }

  componentDidUpdate(prevProps: ChatListItemProps) {
    if (prevProps?.latestMsgId !== this.props.latestMsgId) {
      this.getLatestMsg();
    }
  }

  hasUnseen() {
    if (this.state.latest.pubkey === Key.getPubKey()) {
      return false;
    }
    return !this.props.active && !(this.state.latest.created_at <= this.state.lastOpened);
  }

  render() {
    const chat = this.props.chat;
    const active = this.props.active ? 'active-item' : '';
    const hasUnseen = this.hasUnseen() ? 'has-unseen' : '';
    const unseenEl = this.hasUnseen() ? <span className="unseen"></span> : null;
    const time =
      (this.state.latest.created_at &&
        Helpers.getRelativeTimeText(new Date(this.state.latest.created_at * 1000))) ||
      '';

    const npub = Key.toNostrBech32Address(chat, 'npub');

    return (
      <div
        onKeyUp={(e: KeyboardEvent) => this.onKeyUp(e)}
        role="button"
        tabIndex={0}
        className={`flex flex-row gap-2 ${hasUnseen} ${active}`}
        onClick={() => route(`/chat/${npub}`)}
      >
        <Avatar str={npub} width={49} />
        <div className="flex flex-row">
          <div className="flex flex-col">
            <span className="name">
              <Name pub={this.props.chat} />
              <small className="ml-2 latest-time text-neutral-500">{time}</small>
            </span>
            <small className="text-neutral-500 truncate">{this.state.latestText}</small>
          </div>
          {unseenEl}
        </div>
      </div>
    );
  }
}

export default ChatListItem;
