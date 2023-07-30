import { route } from 'preact-router';

import BaseComponent from '../../BaseComponent';
import Show from '../../components/helpers/Show';
import Avatar from '../../components/user/Avatar';
import Name from '../../components/user/Name';
import Helpers from '../../Helpers';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation.mjs';

interface ChatListItemProps {
  chat: string;
  active?: boolean;
  latestMsgId?: string;
}

interface ChatListItemState {
  name: string | null;
  latest: any;
  latestText: string;
  lastOpened: number;
}

class ChatListItem extends BaseComponent<ChatListItemProps, ChatListItemState> {
  constructor() {
    super();
    this.state = {
      name: null,
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
    const isGroup = this.props.chat.length < 20;
    if (isGroup) {
      localState
        .get('groups')
        .get(this.props.chat)
        .on((group) => {
          if (group.name) {
            this.setState({ name: group.name });
          }
        });
    }
    this.getLatestMsg();
  }

  componentDidUpdate(prevProps: ChatListItemProps) {
    if (prevProps?.latestMsgId !== this.props.latestMsgId) {
      this.getLatestMsg();
    }
  }

  render() {
    const chat = this.props.chat;
    const active = this.props.active ? 'bg-neutral-800' : 'hover:bg-neutral-900';
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
        className={`flex p-2 flex-row gap-4 ${active}`}
        onClick={() => route(`/chat/${npub || chat}`)}
      >
        <Avatar str={npub || chat} width={49} />
        <div className="flex flex-row">
          <div className="flex flex-col">
            <span className="name">
              <Show when={this.state.name}>{this.state.name}</Show>
              <Show when={!this.state.name}>
                <Show when={this.props.chat === Key.getPubKey()}>
                  <span className="font-bold italic">📝 {t('note_to_self')}</span>
                </Show>
                <Show when={this.props.chat !== Key.getPubKey()}>
                  <Name pub={this.props.chat} />
                </Show>
                <small className="ml-2 latest-time text-neutral-500">{time}</small>
              </Show>
            </span>
            <small className="text-neutral-500 truncate">{this.state.latestText}</small>
          </div>
        </div>
      </div>
    );
  }
}

export default ChatListItem;
