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
import ZapModal from '../modal/Zap';

import ReactionsList from './ReactionsList';
import { CheckCorrect, FlagMarkSolid } from '../../dwotr/Icons';
import graphNetwork from '../../dwotr/GraphNetwork';
import { EntityType } from '../../dwotr/Graph';

const ReactionButtons = (props) => {
  const [state, setState] = useState({
    reposts: 0,
    reposted: false,
    likes: 0,
    zapAmountByUser: null as Map<string, number> | null,
    totalZapAmount: 0,
    formattedZapAmount: '',
    liked: false,
    zapped: false,
    repostedBy: new Set<string>(),
    likedBy: new Set<string>(),
    replyCount: 0,
    showZapModal: false,
    lightning: undefined,

    showTrustsList: false,
    trustCount: 0,
    trusted: false,
    trustedBy: new Set<string>(),
    
    showDistrustsList: false,
    distrustCount: 0,
    distrusted: false,
    distrustedBy: new Set<string>(),

  });

  const event = props.event;
  const wot = props.wot;

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

  useEffect(() => {
    const score = wot?.vertice?.score;
    setState((prevState) => ({
      ...prevState,
      
      trustCount: score?.trustCount,
      trusted: score?.isDirectTrusted(),
      
      distrustCount: score?.distrustCount,
      distrusted: score?.isDirectDistrusted(),
    }));
  }, [wot])

  function trustBtnClicked(e) {
    e.preventDefault();
    e.stopPropagation();
    setState((prevState) => {
      let val = (!prevState.trusted) ? 1 : 0;
      graphNetwork.publishTrust(event.id, val, EntityType.Item);

      return {
        ...prevState,
        trusted: !prevState.trusted,
        distrusted: false,
        };
      });

  }

  function distrustBtnClicked(e) {
    e.preventDefault();
    e.stopPropagation();

    setState((prevState) => {
        let val = (!prevState.distrusted) ? -1 : 0;
        graphNetwork.publishTrust(event.id, val, EntityType.Item);
  
        return {
          ...prevState,
          trusted: false,
          distrusted: !prevState.distrusted,
          }
        }
      );
  }

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
    const zapAmountByUser = new Map<string, number>();
    let totalZapAmount = 0;
    zapEvents.forEach((event) => {
      const bolt11 = event?.tags.find((tag) => tag[0] === 'bolt11')[1];
      if (!bolt11) {
        console.log('Invalid zap, missing bolt11 tag');
        return;
      }
      const decoded = decodeInvoice(bolt11);
      const amount = (decoded?.amount || 0) / 1000;
      totalZapAmount += amount;
      const zapper = Events.getZappingUser(event.id);
      if (zapper) {
        const existing = zapAmountByUser.get(zapper) || 0;
        zapAmountByUser.set(zapper, existing + amount);
      }
    });

    props.setReplies(sortedReplies);

    setState((prevState) => ({
      ...prevState,
      reposts: repostedBy.size,
      reposted: repostedBy.has(myPub),
      likes: likedBy.size,
      totalZapAmount,
      formattedZapAmount: (totalZapAmount && formatAmount(totalZapAmount)) || '',
      zapAmountByUser,
      liked: likedBy.has(myPub),
      likedBy,
      repostedBy,
      replyCount: threadReplyCount,
    }));
  }

  function renderReactionBtns() {
    const s = state;
    const likes = Array.from(s.likedBy) || [];
    const reposts = Array.from(s.repostedBy) || [];
    return (
      <>
        {props.standalone && (
          <ReactionsList
            event={props.event}
            likes={likes}
            zapAmountByUser={s.zapAmountByUser}
            formattedZapAmount={s.formattedZapAmount}
            reposts={reposts}
            wot={wot}
            trustCount={s.trustCount}
            distrustCount={s.distrustCount}
          />
        )}
        <div className="flex">
          <a
            className="btn-ghost btn-sm flex-1 hover:bg-transparent hover:text-iris-blue btn content-center gap-2 rounded-none text-neutral-500"
            onClick={() => replyBtnClicked()}
          >
            <ChatBubbleOvalLeftIcon width={18} />
            <span>{s.replyCount || ''}</span>
          </a>
          {props.settings.showReposts ? (
            <>
              <a
                className={`btn-ghost btn-sm flex-1 hover:bg-transparent btn content-center gap-2 rounded-none ${
                  s.reposted ? 'text-iris-green' : 'hover:text-iris-green text-neutral-500'
                }`}
                onClick={(e) => repostBtnClicked(e)}
              >
                <ArrowPathIcon width={18} />
                {(!props.standalone && s.reposts) || ''}
              </a>
            </>
          ) : (
            ''
          )}
          {props.settings.showLikes ? (
            <>
              <a
                className={`btn-ghost btn-sm flex-1 justify-center hover:bg-transparent btn content-center gap-2 rounded-none ${
                  s.liked ? 'text-iris-red' : 'hover:text-iris-red text-neutral-500'
                }`}
                onClick={(e) => likeBtnClicked(e)}
              >
                {s.liked ? <HeartIconFull width={18} /> : <HeartIcon width={18} />}
                {(!props.standalone && s.likes) || ''}
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
                className={`btn-ghost btn-sm flex-1 hover:bg-transparent btn content-center gap-2 rounded-none
              ${s.zapped ? 'text-iris-orange' : 'text-neutral-500 hover:text-iris-orange'}`}
              >
                <BoltIcon width={18} />
                {!props.standalone && s.formattedZapAmount}
              </a>
            </>
          ) : (
            ''
          )}
        {props.settings.showTrusts ? (
          <>
            <a
              className={`msg-btn trust-btn ${s.trusted ? "trusted" : ""}`}
              onClick={(e) => trustBtnClicked(e)}
              title={s.trusted ? "Trusted" : "Trust"}
            >
              {s.trusted ? (
                <CheckCorrect size={24} fill="green" stroke='currentColor' />
              ) : (
                <CheckCorrect size={24} fill="none" stroke='currentColor' />
              )}
            </a>
            {(!props.standalone && s.trustCount) || ""}
          </>
        ) : (
          ""
        )}

        {props.settings.showDistrusts ? (
          <>
            <a
              className={`msg-btn trust-btn ${s.distrusted ? "distrusted" : ""}`}
              onClick={(e) => distrustBtnClicked(e)}
              title={s.distrusted ? "Distrusted" : "Distrust"}
            >
              {s.distrusted ? (
                <FlagMarkSolid size={24} fill="red" stroke='currentColor' /> 
              ) : (
                <FlagMarkSolid size={24} fill="none" stroke='currentColor' />
              )}
            </a>
            {(!props.standalone && s.distrustCount) || ""}
          </>
        ) : (
          ""
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

  return (
    <>
      {renderReactionBtns()}
      {state.lightning && state.showZapModal && renderZapModal()}
    </>
  );
};

export default memo(ReactionButtons);
