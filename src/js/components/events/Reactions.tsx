import { ArrowPathIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconFull } from '@heroicons/react/24/solid';
import $ from 'jquery';
import { memo } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import styled from 'styled-components';

import Icons from '../../Icons';
import { decodeInvoice, formatAmount } from '../../Lightning';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import Identicon from '../Identicon';
import ZapModal from '../modal/Zap';

const ReactionButtons = styled.div`
  display: flex;
  align-items: flex-end;
  flex-direction: row;
  text-align: right;
  font-size: 14px;
  color: var(--text-time);

  a {
    flex: 1;
  }

  .msg.quote &,
  .msg.standalone & {
    margin-bottom: 12px;
  }
`;

const ReactionCount = styled.span`
  flex: 3;
  margin-left: 5px;
  cursor: pointer;
  min-width: 2em;
  text-align: left;
  user-select: none;
  white-space: nowrap;

  &:not(:last-of-type) {
    margin-right: 5px;
  }

  ${(props) => (props.active ? 'color: var(--text-color)' : '')};
`;

const Reactions = (props) => {
  const [state, setState] = useState({
    reposts: 0,
    reposted: false,
    likes: 0,
    zappers: null,
    totalZapped: '',
    liked: false,
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
    zaps: Set<string>,
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
    const zappers = zapEvents.map((event) => Events.getZappingUser(event.id));
    const totalZapped = zapEvents.reduce((acc, event) => {
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
      totalZapped: totalZapped && formatAmount(totalZapped),
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
    return (
      <ReactionButtons>
        <a className="msg-btn reply-btn" onClick={() => replyBtnClicked()}>
          {Icons.reply}
        </a>
        <ReactionCount>{s.replyCount || ''}</ReactionCount>
        {props.settings.showReposts ? (
          <>
            <a
              className={`msg-btn repost-btn ${s.reposted ? 'reposted' : ''}`}
              onClick={(e) => repostBtnClicked(e)}
            >
              <ArrowPathIcon width={24} />
            </a>
            <ReactionCount active={s.showReposts} onClick={(e) => toggleReposts(e)}>
              {s.reposts || ''}
            </ReactionCount>
          </>
        ) : (
          ''
        )}
        {props.settings.showLikes ? (
          <>
            <a
              className={`msg-btn like-btn ${s.liked ? 'liked' : ''}`}
              onClick={(e) => likeBtnClicked(e)}
            >
              {s.liked ? <HeartIconFull width={24} /> : <HeartIcon width={24} />}
            </a>
            <ReactionCount active={s.showLikes} onClick={(e) => toggleLikes(e)}>
              {s.likes || ''}
            </ReactionCount>
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
              className="msg-btn zap-btn"
            >
              {Icons.lightning}
            </a>
            <ReactionCount active={s.showZaps} onClick={(e) => toggleZaps(e)}>
              {s.totalZapped || ''}
            </ReactionCount>
          </>
        ) : (
          ''
        )}
      </ReactionButtons>
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
      {renderReactionBtns()}
      {state.showLikes && renderLikes()}
      {state.showZaps && renderZaps()}
      {state.showReposts && renderReposts()}
      {state.lightning && state.showZapModal && renderZapModal()}
    </>
  );
};

export default memo(Reactions);
