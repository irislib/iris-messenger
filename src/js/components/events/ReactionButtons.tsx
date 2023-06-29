import {
  ArrowPathIcon,
  BoltIcon,
  ChatBubbleOvalLeftIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import {
  //  ArrowPathIcon as ArrowPathIconFull,
  //  BoltIcon as BoltIconFull,
  HeartIcon as HeartIconFull,
} from '@heroicons/react/24/solid';
import $ from 'jquery';
import { memo } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';

import { decodeInvoice, formatAmount } from '../../Lightning';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import Identicon from '../Identicon';
import ZapModal from '../modal/Zap';

import ReactionsList from './ReactionsList';

const ReactionButtons = (props) => {
  const [state, setState] = useState({
    reposts: 0,
    reposted: false,
    likes: 0,
    zappers: null as string[] | null,
    totalZapAmount: '',
    liked: false,
    zapped: false,
    repostedBy: new Set<string>(),
    likedBy: new Set<string>(),
    replyCount: 0,
    showLikes: false,
    showZaps: false,
    showReposts: false,
    showZapModal: false,
    lightning: undefined,
  });

  const event = props.event;

  useEffect(() => {
    if (event) {
      const unsub1 = Events.getRepliesAndReactions(event.id, (...args) =>
        handleRepliesAndReactions(...args),
      );

      const unsub2 = SocialNetwork.getProfile(event.pubkey, (profile) => {
        if (!profile) return;
        const lightning = profile.lud16 || profile.lud06;
        setState((prevState) => ({
          ...prevState,
          lightning,
        }));
      });

      return () => {
        unsub1();
        unsub2();
      };
    }
  }, [event]);

  function replyBtnClicked() {
    if (props.standalone) {
      $(document).find('textarea').focus();
    } else {
      route(`/${Key.toNostrBech32Address(props.event.id, 'note')}`);
    }
  }

  function likeBtnClicked(e) {
    e.preventDefault();
    e.stopPropagation();
    like(!state.liked);
  }

  function repostBtnClicked(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!state.reposted) {
      const author = props.event.pubkey;
      const hexId = Key.toNostrHexAddress(props.event.id);
      if (hexId) {
        Events.publish({
          kind: 6,
          tags: [
            ['e', hexId, '', 'mention'],
            ['p', author],
          ],
          content: '',
        });
      }
    }
  }

  function like(liked = true) {
    if (liked) {
      const author = props.event.pubkey;

      const hexId = Key.toNostrHexAddress(props.event.id);
      if (hexId) {
        Events.publish({
          kind: 7,
          content: '+',
          tags: [
            ['e', hexId],
            ['p', author],
          ],
        });
      }
    }
  }

  function toggleLikes(e) {
    console.log('toggle likes');
    e.stopPropagation();
    setState((prevState) => ({
      ...prevState,
      showLikes: !state.showLikes,
      showZaps: false,
      showReposts: false,
    }));
  }

  function toggleReposts(e) {
    e.stopPropagation();
    setState((prevState) => ({
      ...prevState,
      showReposts: !state.showReposts,
      showZaps: false,
      showLikes: false,
    }));
  }

  function toggleZaps(e) {
    e.stopPropagation();
    setState((prevState) => ({
      ...prevState,
      showZaps: !state.showZaps,
      showReposts: false,
      showLikes: false,
    }));
  }

  function handleRepliesAndReactions(
    replies: Set<string>,
    likedBy: Set<string>,
    threadReplyCount: number,
    repostedBy: Set<string>,
    zaps: any,
  ) {
    // zaps.size &&
    //  console.log('zaps.size', zaps.size, Key.toNostrBech32Address(event.id, 'note'));
    const myPub = Key.getPubKey();
    const sortedReplies =
      replies &&
      Array.from(replies).sort((a, b) => {
        // heavy op? unnecessary when they're not even shown?
        const eventA = Events.db.by('id', a);
        const eventB = Events.db.by('id', b);
        // show our replies first
        if (eventA?.pubkey === myPub && eventB?.pubkey !== myPub) {
          return -1;
        } else if (eventA?.pubkey !== myPub && eventB?.pubkey === myPub) {
          return 1;
        }
        // show replies by original post's author first
        if (eventA?.pubkey === event?.pubkey && eventB?.pubkey !== event?.pubkey) {
          return -1;
        } else if (eventA?.pubkey !== event?.pubkey && eventB?.pubkey === event?.pubkey) {
          return 1;
        }
        return eventA?.created_at - eventB?.created_at;
      });

    const zapEvents = Array.from(zaps?.values()).map((eventId) => Events.db.by('id', eventId));
    const zappers = zapEvents
      .map((event) => Events.getZappingUser(event.id))
      .filter((user) => user !== null) as string[];
    const totalZapAmount = zapEvents.reduce((acc, event) => {
      const bolt11 = event?.tags.find((tag) => tag[0] === 'bolt11')[1];
      if (!bolt11) {
        console.log('Invalid zap, missing bolt11 tag');
        return acc;
      }
      const decoded = decodeInvoice(bolt11);
      const amount = (decoded?.amount || 0) / 1000;
      return acc + Number(amount);
    }, 0);

    props.setReplies(sortedReplies);

    setState((prevState) => ({
      ...prevState,
      reposts: repostedBy.size,
      reposted: repostedBy.has(myPub),
      likes: likedBy.size,
      totalZapAmount,
      formattedZapAmount: totalZapAmount && formatAmount(totalZapAmount),
      zappers,
      liked: likedBy.has(myPub),
      likedBy,
      repostedBy,
      replyCount: threadReplyCount,
    }));
  }

  function renderLikes() {
    return (
      <div className="likes">
        {Array.from(state.likedBy).map((key) => {
          const npub = Key.toNostrBech32Address(key, 'npub');
          return (
            <Identicon showTooltip={true} onClick={() => route(`/${npub}`)} str={npub} width={32} />
          );
        })}
      </div>
    );
  }

  function renderReactionBtns() {
    const s = state;
    const likes = Array.from(s.likedBy) || [];
    const reposts = Array.from(s.repostedBy) || [];
    const zaps = Array.from(s.zappers || []);
    console.log('111', likes, reposts, zaps);
    return (
      <>
        {props.standalone && (
          <ReactionsList event={props.event} likes={likes} zaps={zaps} reposts={reposts} />
        )}
        <div className="flex">
          <a
            className="btn-ghost flex-1 hover:bg-transparent hover:text-iris-blue btn content-center gap-2 rounded-none p-2 text-neutral-500"
            onClick={() => replyBtnClicked()}
          >
            <ChatBubbleOvalLeftIcon width={18} />
            <span>{s.replyCount || ''}</span>
          </a>
          {props.settings.showReposts ? (
            <>
              <a
                className={`btn-ghost flex-1 hover:bg-transparent btn content-center gap-2 rounded-none p-2 ${
                  s.reposted ? 'text-iris-green' : 'hover:text-iris-green text-neutral-500'
                }`}
                onClick={(e) => repostBtnClicked(e)}
              >
                <ArrowPathIcon width={18} />
                <span
                  className={`${s.showReposts ? 'active' : ''}`}
                  onClick={(e) => toggleReposts(e)}
                >
                  {s.reposts || ''}
                </span>
              </a>
            </>
          ) : (
            ''
          )}
          {props.settings.showLikes ? (
            <>
              <a
                className={`btn-ghost flex-1 justify-center hover:bg-transparent btn content-center gap-2 rounded-none p-2 ${
                  s.liked ? 'text-iris-red' : 'hover:text-iris-red text-neutral-500'
                }`}
                onClick={(e) => likeBtnClicked(e)}
              >
                {s.liked ? <HeartIconFull width={18} /> : <HeartIcon width={18} />}
                <span className={`${s.showLikes ? 'active' : ''}`} onClick={(e) => toggleLikes(e)}>
                  {s.likes || ''}
                </span>
              </a>
            </>
          ) : (
            ''
          )}
          {props.settings.showZaps && state.lightning ? (
            <>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setState((prevState) => ({ ...prevState, showZapModal: true }));
                }}
                className={`btn-ghost flex-1 hover:bg-transparent btn content-center gap-2 rounded-none p-2
              ${s.zapped ? 'text-iris-orange' : 'text-neutral-500 hover:text-iris-orange'}`}
              >
                <BoltIcon width={18} />
                <span className={`${s.showZaps ? 'active' : ''}`} onClick={(e) => toggleZaps(e)}>
                  {s.totalZapAmount || ''}
                </span>
              </a>
            </>
          ) : (
            ''
          )}
        </div>
      </>
    );
  }

  function renderZapModal() {
    return (
      <ZapModal
        show={true}
        lnurl={state.lightning}
        note={props.event.id}
        recipient={props.event.pubkey}
        onClose={() => setState((prevState) => ({ ...prevState, showZapModal: false }))}
      />
    );
  }

  function renderZaps() {
    return (
      <div className="likes">
        {(state.zappers || []).map((npub) => {
          return (
            <Identicon showTooltip={true} onClick={() => route(`/${npub}`)} str={npub} width={32} />
          );
        })}
      </div>
    );
  }

  function renderReposts() {
    return (
      <div className="likes">
        {Array.from(state.repostedBy).map((key) => {
          const npub = Key.toNostrBech32Address(key, 'npub');
          return (
            <Identicon showTooltip={true} onClick={() => route(`/${npub}`)} str={npub} width={32} />
          );
        })}
      </div>
    );
  }

  return (
    <>
      <hr className="-mx-4 opacity-10" />
      {renderReactionBtns()}
      {state.showLikes && renderLikes()}
      {state.showZaps && renderZaps()}
      {state.showReposts && renderReposts()}
      {state.lightning && state.showZapModal && renderZapModal()}
    </>
  );
};

export default memo(ReactionButtons);
