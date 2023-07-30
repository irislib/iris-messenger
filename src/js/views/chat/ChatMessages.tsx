import { useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { QrCodeIcon } from '@heroicons/react/24/solid';
import $ from 'jquery';
import throttle from 'lodash/throttle';
import { getPublicKey, nip04 } from 'nostr-tools';
import { useEffect, useRef, useState } from 'preact/hooks';

import Copy from '../../components/buttons/Copy';
import Show from '../../components/helpers/Show';
import PrivateMessage from '../../components/PrivateMessage';
import QrCode from '../../components/QrCode';
import Helpers from '../../Helpers';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import PubSub from '../../nostr/PubSub';
import { translate as t } from '../../translations/Translation.mjs';

import ChatMessageForm from './ChatMessageForm.tsx';
import { addGroup, sendSecretInvite } from './NewChat';

function ChatMessages({ id }) {
  const ref = useRef(null);
  const [sortedMessages, setSortedMessages] = useState([] as any[]);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [invitedToPriv, setInvitedToPriv] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [keyPair, setKeyPair] = useState(
    undefined as { pubKey: string; privKey: string } | undefined,
  );
  const [isGroup, setIsGroup] = useState(false);
  let unsub;
  let messageViewScrollHandler;

  const addFloatingDaySeparator = () => {
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
  };

  const onClickSecretInvite = () => {
    const hexId = Key.toNostrHexAddress(id);
    sendSecretInvite(hexId);
  };

  const toggleScrollDownBtn = () => {
    const el = $('#message-view');
    const scrolledToBottom = el[0].scrollHeight - el.scrollTop() <= el.outerHeight() + 200;
    if (scrolledToBottom) {
      $('#scroll-down-btn:visible').fadeOut(150);
    } else {
      $('#scroll-down-btn:not(:visible)').fadeIn(150);
    }
  };

  const formatPrivateKey = useCallback(() => {
    const nsec = keyPair?.privKey && Key.toNostrBech32Address(keyPair.privKey, 'nsec');
    return nsec || ''; // `nostr:${nsec}?role=group` ?
  }, [keyPair]);

  const onMessageViewScroll = () => {
    messageViewScrollHandler =
      messageViewScrollHandler ||
      throttle(() => {
        if ($('#attachment-preview:visible').length) {
          return;
        }
        addFloatingDaySeparator();
        toggleScrollDownBtn();
      }, 200);
    messageViewScrollHandler();
  };

  const scrollDown = () => {
    Helpers.scrollToMessageListBottom();
    const el = document.getElementById('message-list');
    el && (el.style.paddingBottom = '0');
  };

  const renderMainView = () => {
    let mainView;
    const myPub = Key.getPubKey();
    const now = new Date();
    const nowStr = now.toLocaleDateString();
    let previousDateStr;
    let previousFrom;
    const msgListContent = [] as any[];

    if (id && id.length > 4) {
      sortedMessages.forEach((msgOrId) => {
        let msg;
        if (typeof msgOrId === 'string') {
          msg = Events.db.by('id', msgOrId);
        } else {
          msg = msgOrId;
        }
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
              <div className="px-2 py-1 inline-block day-separator bg-black opacity-50 text-white rounded-full">
                {t(separatorText.toLowerCase())}
              </div>,
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
            chatId={id}
          />,
        );
      });

      mainView = (
        <div
          className="main-view p-2 overflow-y-auto overflow-x-hidden flex-grow"
          id="message-view"
          onScroll={() => onMessageViewScroll()}
        >
          <div id="message-list" className="w-full">
            {msgListContent}
            <div className="italic my-2 text-neutral-500 w-full text-center">
              <Show when={isGroup && keyPair}>
                <div>{t('secret_group_chat')}</div>
                <div className="flex gap-2 flex-1 items-center justify-center my-4">
                  <button
                    className="btn btn-neutral btn-sm"
                    onClick={() => setShowQr((showQr) => !showQr)}
                  >
                    <QrCodeIcon width="20" />
                    {t('show_qr_code')}
                  </button>
                  {/* TODO copy iris.to chat link */}
                  <Copy
                    className="btn btn-neutral btn-sm"
                    copyStr={formatPrivateKey()}
                    text="Copy nsec"
                  />
                  <Copy
                    className="btn btn-neutral btn-sm"
                    copyStr={Helpers.buildURL('chat', undefined, formatPrivateKey())}
                    text={t('copy_link')}
                  />
                </div>
                <Show when={showQr}>
                  <QrCode data={'nostr:' + formatPrivateKey()} />
                </Show>
              </Show>
              <Show when={!isGroup && Key.toNostrHexAddress(id) !== myPub}>
                <div>{t('dm_privacy_warning')}</div>
                <div className="mt-4 flex gap-2 justify-center">
                  <Show when={invitedToPriv}>
                    <button
                      className="btn btn-neutral btn-sm"
                      onClick={() => addGroup(invitedToPriv)}
                    >
                      Go to secret chat
                    </button>
                  </Show>
                  <Show when={!invitedToPriv}>
                    <button className="btn btn-neutral btn-sm" onClick={onClickSecretInvite}>
                      Invite to secret chat
                    </button>
                  </Show>
                </div>
              </Show>
            </div>
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
  };

  const messagesById = new Map<string, any>();

  const renderMsgForm = () => {
    return (
      <>
        <div id="scroll-down-btn" style={{ display: 'none' }} onClick={() => scrollDown()}>
          <ChevronDownIcon width="24" />
        </div>
        <ChatMessageForm key={id} activeChat={id} onSubmit={() => scrollDown()} keyPair={keyPair} />
      </>
    );
  };

  useEffect(() => {
    const hexId = Key.toNostrHexAddress(id);
    const subscribePrivate = (hexId) => {
      unsub = PubSub.subscribe({ kinds: [4], '#p': [Key.getPubKey()], authors: [hexId] });
      Events.getDirectMessagesByUser(hexId, (msgIds) => {
        if (msgIds) {
          setSortedMessages(msgIds.reverse());
        }
      });
    };

    localState
      .get('chatInvites')
      .get(hexId)
      .once((invite) => {
        if (invite?.priv) {
          setInvitedToPriv(invite.priv);
        }
      });

    const subscribeGroup = () => {
      localState
        .get('groups')
        .get(id)
        .on((group) => {
          const privKey = group.key;
          const pubKey = getPublicKey(privKey);
          setKeyPair({ privKey, pubKey });
          unsub = PubSub.subscribe(
            { kinds: [4], '#p': [pubKey], authors: [pubKey] },
            async (event) => {
              const decrypted = await nip04.decrypt(privKey, pubKey, event.content);
              messagesById.set(event.id, { ...event, text: decrypted });
              setSortedMessages(Array.from(messagesById.values()));
            },
          );
        });
    };

    if (hexId) {
      subscribePrivate(hexId);
    } else {
      setIsGroup(true);
      subscribeGroup();
    }

    const container = document.getElementById('message-list');
    if (container) {
      container.style.paddingBottom = '0';
      container.style.paddingTop = '0';
      const el = $('#message-view');
      el.off('scroll').on('scroll', () => {
        const scrolledToBottom = el[0].scrollHeight - el.scrollTop() == el.outerHeight();
        if (stickToBottom && !scrolledToBottom) {
          setStickToBottom(false);
        } else if (!stickToBottom && scrolledToBottom) {
          setStickToBottom(true);
        }
      });
    }

    return () => {
      unsub && unsub();
    };
  }, [id]);

  useEffect(() => {
    if (stickToBottom) {
      Helpers.scrollToMessageListBottom();
    }

    $('.msg-content img')
      .off('load')
      .on('load', () => stickToBottom && Helpers.scrollToMessageListBottom());
  }, [stickToBottom]);

  return (
    <>
      <Helmet>
        <title>{'Messages'}</title>
      </Helmet>
      <div id="chat-main" ref={ref} className={`${id ? '' : 'hidden'} flex flex-1 flex-col`}>
        {renderMainView()}
        <Show when={id && id.length > 4}>{renderMsgForm()}</Show>
      </div>
    </>
  );
}

export default ChatMessages;
