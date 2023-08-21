import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { QrCodeIcon } from '@heroicons/react/24/solid';
import throttle from 'lodash/throttle';
import { Event, getPublicKey, nip04 } from 'nostr-tools';

import Copy from '../../components/buttons/Copy';
import Show from '../../components/helpers/Show';
import PrivateMessage from '../../components/PrivateMessage';
import QrCode from '../../components/QrCode';
import Key from '../../nostr/Key';
import PubSub from '../../nostr/PubSub';
import localState from '../../state/LocalState.ts';
import { translate as t } from '../../translations/Translation.mjs';
import Helpers from '../../utils/Helpers';
import SortedMap from '../../utils/SortedMap/SortedMap.tsx';

import ChatMessageForm from './ChatMessageForm';
import { addGroup, sendSecretInvite } from './NewChat';

export type DecryptedEvent = Event & { text?: string };

const scrollToMessageListBottom = throttle(() => {
  const messageView = document.querySelector('#message-view');
  if (messageView) {
    messageView.scrollTo(0, messageView.scrollHeight - messageView.clientHeight);
  }
}, 100);

function ChatMessages({ id }) {
  const ref = useRef(null as any);
  const messages = useRef(new SortedMap<string, DecryptedEvent>([], 'created_at'));
  const [sortedMessages, setSortedMessages] = useState([] as any[]);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [invitedToPriv, setInvitedToPriv] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [keyPair, setKeyPair] = useState(
    undefined as { pubKey: string; privKey: string } | undefined,
  );
  const [isGroup, setIsGroup] = useState(false);
  const chatId = useMemo(() => Key.toNostrHexAddress(id) || id, [id]);
  const subs = [] as any[];
  let messageViewScrollHandler;

  const addFloatingDaySeparator = () => {
    const daySeparators = document.querySelectorAll('.day-separator');
    let currentDaySeparator: any = daySeparators[daySeparators.length - 1];
    let pos = currentDaySeparator.getBoundingClientRect();

    while (currentDaySeparator && pos && pos.top - 55 > 0) {
      currentDaySeparator = currentDaySeparator.previousElementSibling;
      while (currentDaySeparator && !currentDaySeparator.classList.contains('day-separator')) {
        currentDaySeparator = currentDaySeparator.previousElementSibling;
      }
      pos = currentDaySeparator ? currentDaySeparator.getBoundingClientRect() : null;
    }
    if (!currentDaySeparator) {
      return;
    }
    const s = currentDaySeparator.cloneNode(true);
    const center = document.createElement('div');
    center.style.position = 'fixed';
    center.style.top = '70px';
    center.style.textAlign = 'center';
    center.setAttribute('id', 'floating-day-separator');
    center.style.width = ref.current.offsetWidth + 'px';
    center.appendChild(s);

    const floatingDaySeparator = document.getElementById('floating-day-separator');
    if (floatingDaySeparator) {
      floatingDaySeparator.remove();
    }

    setTimeout(() => {
      s.style.opacity = '0';
      s.style.transition = 'opacity 2s';
    }, 2000);

    ref.current.prepend(center);
  };

  const onClickSecretInvite = () => {
    sendSecretInvite(chatId);
  };

  const toggleScrollDownBtn = () => {
    const el = ref.current;
    const scrolledToBottom = el.scrollHeight - el.scrollTop <= el.offsetHeight + 200;

    const scrollDownBtn: any = document.getElementById('scroll-down-btn');

    if (scrolledToBottom) {
      if (window.getComputedStyle(scrollDownBtn).display !== 'none') {
        fadeOut(scrollDownBtn, 100);
      }
    } else {
      if (window.getComputedStyle(scrollDownBtn).display === 'none') {
        fadeIn(scrollDownBtn, 100);
      }
    }
  };

  const fadeOut = (element, duration) => {
    let op = 1; // initial opacity
    const timer = setInterval(() => {
      if (op <= 0.1) {
        clearInterval(timer);
        element.style.display = 'none';
      }
      element.style.opacity = op;
      element.style.filter = 'alpha(opacity=' + op * 100 + ')';
      op -= op * 0.1;
    }, duration / 10);
  };

  const fadeIn = (element, duration) => {
    let op = 0.1; // initial opacity
    element.style.display = 'block';
    const timer = setInterval(() => {
      if (op >= 1) {
        clearInterval(timer);
      }
      element.style.opacity = op;
      element.style.filter = 'alpha(opacity=' + op * 100 + ')';
      op += op * 0.1;
    }, duration / 10);
  };

  const formatPrivateKey = useCallback(() => {
    const nsec = keyPair?.privKey && Key.toNostrBech32Address(keyPair.privKey, 'nsec');
    return nsec || ''; // `nostr:${nsec}?role=group` ?
  }, [keyPair]);

  const onMessageViewScroll = () => {
    messageViewScrollHandler =
      messageViewScrollHandler ||
      throttle(() => {
        const attachmentPreview = document.getElementById('attachment-preview');
        if (attachmentPreview && window.getComputedStyle(attachmentPreview).display !== 'none') {
          return;
        }
        addFloatingDaySeparator();
        toggleScrollDownBtn();
      }, 200);
    messageViewScrollHandler();
  };

  const scrollDown = () => {
    const el = ref.current;
    el?.scrollTo({ top: el.scrollHeight });
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
      sortedMessages.forEach((event) => {
        if (!event) {
          return null;
        }
        const date = new Date(event.created_at * 1000);
        let isDifferentDay;
        if (date) {
          const dateStr = date.toLocaleDateString();
          if (dateStr !== previousDateStr) {
            isDifferentDay = true;
            const separatorText = Helpers.getDaySeparatorText(date, dateStr, now, nowStr);
            msgListContent.push(
              <div className="px-2 mt-3 mb-4 py-1 inline-block day-separator bg-black opacity-50 text-white rounded-full">
                {t(separatorText.toLowerCase())}
              </div>,
            );
          }
          previousDateStr = dateStr;
        }

        let showName = isDifferentDay;
        if (!isDifferentDay && previousFrom && event.pubkey !== previousFrom) {
          msgListContent.push(<div className="m-2" />);
          showName = true;
        }
        previousFrom = event.pubkey;
        msgListContent.push(
          <PrivateMessage
            event={event}
            showName={showName}
            selfAuthored={event.pubkey === myPub}
            key={`${event.created_at}${event.pubkey}`}
          />,
        );
      });

      mainView = (
        <div
          ref={ref}
          className="main-view p-2 overflow-y-auto overflow-x-hidden flex flex-col flex-grow h-full"
          onScroll={() => onMessageViewScroll()}
        >
          <div className="w-full flex flex-col items-center justify-end">
            {msgListContent}
            <div className="italic my-2 text-neutral-500 w-full text-center justify-self-center">
              <Show when={isGroup && keyPair}>
                <div>{t('secret_chat')}</div>
                <div className="flex gap-2 flex-1 items-center justify-center mt-4">
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
                  <div className="mt-4">
                    <QrCode data={'nostr:' + formatPrivateKey()} />
                  </div>
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

  // on ref.current height change scroll down. TODO only if stickToBottom
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) {
      const observer = new ResizeObserver(() => {
        scrollDown();
      });
      observer.observe(el);
      return () => {
        observer.disconnect();
      };
    }
  });

  useEffect(() => {
    const subscribePrivate = (chatId) => {
      const cb = (event) => {
        messages.current.set(event.id, event);
        setSortedMessages(Array.from(messages.current.values()));
      };
      subs.push(PubSub.subscribe({ kinds: [4], '#p': [Key.getPubKey()], authors: [chatId] }, cb));
      if (chatId !== Key.getPubKey()) {
        subs.push(PubSub.subscribe({ kinds: [4], '#p': [chatId], authors: [Key.getPubKey()] }, cb));
      }
    };

    localState
      .get('chatInvites')
      .get(chatId)
      .once((invite) => {
        if (invite?.priv) {
          setInvitedToPriv(invite.priv);
        }
      });

    const subscribeGroup = () => {
      const node = localState.get('groups').get(id);
      node.on((group) => {
        const privKey = group.key;
        const pubKey = getPublicKey(privKey);
        setKeyPair({ privKey, pubKey });
        subs.push(
          PubSub.subscribe({ kinds: [4], '#p': [pubKey], authors: [pubKey] }, async (event) => {
            const decrypted = await nip04.decrypt(privKey, pubKey, event.content);
            messages.current.set(event.id, { ...event, text: decrypted });
            setSortedMessages(Array.from(messages.current.values()));
            const latest = node.get('latest');
            const e = await latest.once();
            if (!e || !e.created_at || e.created_at < event.created_at) {
              latest.put({
                id: event.id,
                created_at: event.created_at,
                text: decrypted.slice(0, decrypted.indexOf('{')),
              });
            }
          }),
        );
      });
    };

    if (Key.toNostrHexAddress(chatId)) {
      subscribePrivate(chatId);
    } else {
      setIsGroup(true);
      subscribeGroup();
    }

    const scrollHandler = () => {
      const scrolledToBottom = el.scrollTop + el.clientHeight >= el.scrollHeight;
      if (stickToBottom && !scrolledToBottom) {
        setStickToBottom(false);
      } else if (!stickToBottom && scrolledToBottom) {
        setStickToBottom(true);
      }
    };
    const el = ref.current;
    if (el) {
      el.addEventListener('scroll', scrollHandler);
    }

    return () => {
      ref.current.removeEventListener('scroll', scrollHandler);
      subs.forEach((unsub) => unsub());
    };
  }, [id]);

  useEffect(() => {
    if (stickToBottom) {
      scrollToMessageListBottom();
    }

    document.querySelectorAll('.msg-content img').forEach((img) => {
      img.removeEventListener('load', imgLoadHandler);
      img.addEventListener('load', imgLoadHandler);
    });

    const imgLoadHandler = () => {
      if (stickToBottom) {
        scrollToMessageListBottom();
      }
    };
  }, [stickToBottom]);

  return (
    <>
      <Helmet>
        <title>{t('messages')}</title>
      </Helmet>
      <div className={`${chatId ? '' : 'hidden'} flex flex-1 flex-col`}>
        {renderMainView()}
        <Show when={chatId && chatId.length > 4}>
          <div className="relative">
            <div
              id="scroll-down-btn"
              style={{ display: 'none' }}
              className="absolute bottom-1 left-2 p-1.5 rounded-3xl bg-neutral-900 opacity-85 hover:cursor-pointer"
              onClick={() => scrollDown()}
            >
              <ChevronDownIcon width="24" />
            </div>
          </div>
          <ChatMessageForm
            key={chatId}
            activeChat={chatId}
            onSubmit={() => scrollDown()}
            keyPair={keyPair}
          />
        </Show>
      </div>
    </>
  );
}

export default ChatMessages;
