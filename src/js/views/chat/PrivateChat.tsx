import { createRef } from 'react';
import { Helmet } from 'react-helmet';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import $ from 'jquery';
import throttle from 'lodash/throttle';
import { PureComponent } from 'preact/compat';

import PrivateMessage from '../../components/PrivateMessage';
import Helpers from '../../Helpers';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import PubSub from '../../nostr/PubSub';
import Session from '../../nostr/Session';
import { translate as t } from '../../translations/Translation.mjs';

import ChatMessageForm from './ChatMessageForm.tsx';

interface PrivateChatState {
  decryptedMessages: Record<string, any>;
  sortedMessages: any[];
  sortedParticipants: any[];
  showParticipants: boolean;
  stickToBottom: boolean;
  noLongerParticipant: boolean;
}

interface PrivateChatProps {
  id: string;
}

class PrivateChat extends PureComponent<PrivateChatProps, PrivateChatState> {
  unsub: any;
  chat: any;
  ref: any;
  messageViewScrollHandler: any;

  constructor(props: PrivateChatProps) {
    super(props);
    this.ref = createRef();
    this.state = {
      decryptedMessages: {},
      sortedMessages: [],
      sortedParticipants: [],
      showParticipants: true,
      stickToBottom: true,
      noLongerParticipant: false,
    };
  }

  shouldComponentUpdate() {
    return true;
  }

  updateLastOpened() {
    const hexId = Key.toNostrHexAddress(this.props.id);
    Session.public?.set('chats/' + hexId + '/lastOpened', Math.floor(Date.now() / 1000));
  }

  componentDidMount() {
    const hexId = Key.toNostrHexAddress(this.props.id);
    if (!hexId) {
      console.error('no id');
      return;
    }
    this.unsub = PubSub.subscribe({ kinds: [4], '#p': [Key.getPubKey()], authors: [hexId] });
    Events.getDirectMessagesByUser(hexId, (msgIds) => {
      if (msgIds) {
        this.setState({ sortedMessages: msgIds.reverse() });
      }
    });
    this.updateLastOpened();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateLastOpened();
      }
    });

    const container = document.getElementById('message-list');
    if (container) {
      container.style.paddingBottom = '0';
      container.style.paddingTop = '0';
      const el = $('#message-view');
      el.off('scroll').on('scroll', () => {
        const scrolledToBottom = el[0].scrollHeight - el.scrollTop() == el.outerHeight();
        if (this.state.stickToBottom && !scrolledToBottom) {
          this.setState({ stickToBottom: false });
        } else if (!this.state.stickToBottom && scrolledToBottom) {
          this.setState({ stickToBottom: true });
        }
      });
    }
  }

  componentWillUnmount() {
    document.removeEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateLastOpened();
      }
    });
    this.unsub && this.unsub();
  }

  componentDidUpdate(previousProps: any) {
    if (this.state.stickToBottom) {
      Helpers.scrollToMessageListBottom();
    }

    if (previousProps.id !== this.props.id) {
      this.updateLastOpened();
    }

    $('.msg-content img')
      .off('load')
      .on('load', () => this.state.stickToBottom && Helpers.scrollToMessageListBottom());

    setTimeout(() => {
      if (
        this.chat &&
        !this.chat.uuid &&
        Key.toNostrHexAddress(this.props.id) !== Key.getPubKey()()
      ) {
        if ($('.msg.our').length && !$('.msg.their').length && !this.chat.theirMsgsLastSeenTime) {
          $('#not-seen-by-them').slideDown();
        } else {
          $('#not-seen-by-them').slideUp();
        }
      }
    }, 2000);
  }

  // Original Preact methods converted to TypeScript with React JSX
  addFloatingDaySeparator() {
    let currentDaySeparator = $('.day-separator').last();
    let pos = currentDaySeparator.position();
    while (currentDaySeparator && pos && pos.top - 55 > 0) {
      currentDaySeparator = currentDaySeparator.prevAll('.day-separator').first();
      pos = currentDaySeparator.position();
    }
    const s = currentDaySeparator.clone();
    const center = $('<div>')
      .css({ position: 'fixed', top: 70, 'text-align': 'center' })
      .attr('id', 'floating-day-separator')
      .width($('#message-view').width())
      .append(s);
    $('#floating-day-separator').remove();
    setTimeout(() => s.fadeOut(), 2000);
    $('#message-view').prepend(center);
  }

  toggleScrollDownBtn() {
    const el = $('#message-view');
    const scrolledToBottom = el[0].scrollHeight - el.scrollTop() <= el.outerHeight() + 200;
    if (scrolledToBottom) {
      $('#scroll-down-btn:visible').fadeOut(150);
    } else {
      $('#scroll-down-btn:not(:visible)').fadeIn(150);
    }
  }

  onMessageViewScroll() {
    this.messageViewScrollHandler =
      this.messageViewScrollHandler ||
      throttle(() => {
        if ($('#attachment-preview:visible').length) {
          return;
        }
        this.addFloatingDaySeparator();
        this.toggleScrollDownBtn();
      }, 200);
    this.messageViewScrollHandler();
  }

  scrollDown() {
    Helpers.scrollToMessageListBottom();
    const el = document.getElementById('message-list');
    el && (el.style.paddingBottom = '0');
  }

  renderMainView() {
    let mainView;
    if (this.props.id && this.props.id.length > 20) {
      const myPub = Key.getPubKey();
      const now = new Date();
      const nowStr = now.toLocaleDateString();
      let previousDateStr;
      let previousFrom;
      const msgListContent: any[] = [];
      this.state.sortedMessages.forEach((msgId) => {
        const msg = Events.db.by('id', msgId);
        if (!msg) {
          return null;
        }
        const date = new Date(msg.created_at * 1000);
        let isDifferentDay;
        if (date) {
          const dateStr = date.toLocaleDateString();
          if (dateStr !== previousDateStr) {
            isDifferentDay = true;
            const separatorText = Helpers.getDaySeparatorText(date, dateStr, now, nowStr);
            msgListContent.push(
              <div className="day-separator">{t(separatorText.toLowerCase())}</div>,
            );
          }
          previousDateStr = dateStr;
        }

        let showName = false;
        if (
          msg.pubkey !== myPub &&
          (isDifferentDay || (previousFrom && msg.pubkey !== previousFrom))
        ) {
          msgListContent.push(<div className="from-separator" />);
          showName = true;
        }
        previousFrom = msg.pubkey;
        msgListContent.push(
          <PrivateMessage
            {...msg}
            showName={showName}
            selfAuthored={msg.pubkey === myPub}
            key={`${msg.created_at}${msg.pubkey}`}
            chatId={this.props.id}
          />,
        );
      });

      mainView = (
        <div className="main-view" id="message-view" onScroll={() => this.onMessageViewScroll()}>
          <div id="message-list">
            {msgListContent}
            <p>
              <i>{t('dm_privacy_warning')}</i>
            </p>
          </div>
          <div
            id="attachment-preview"
            className="attachment-preview"
            style={{ display: 'none' }}
          ></div>
        </div>
      );
    }
    return mainView;
  }

  renderMsgForm() {
    return this.props.id && this.props.id.length > 20 ? (
      <>
        <div id="scroll-down-btn" style={{ display: 'none' }} onClick={() => this.scrollDown()}>
          <ChevronDownIcon width="24" />
        </div>
        <div className="chat-message-form">
          <ChatMessageForm
            key={this.props.id}
            activeChat={this.props.id}
            onSubmit={() => this.scrollDown()}
          />
        </div>
      </>
    ) : (
      ''
    );
  }

  render() {
    return (
      <>
        <Helmet>
          <title>{(this.chat && this.chat.name) || 'Messages'}</title>
        </Helmet>
        <div id="chat-main" ref={this.ref} className={`${this.props.id ? '' : 'hidden'} flex-1`}>
          {this.renderMainView()} {this.renderMsgForm()}
        </div>
      </>
    );
  }
}

export default PrivateChat;
