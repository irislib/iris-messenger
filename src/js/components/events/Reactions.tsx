import $ from 'jquery';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';

import Icons from '../../Icons';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Identicon from '../Identicon';
import ZapModal from '../modal/Zap';

const Reactions = (props) => {
  const [state, setState] = useState({
    reposts: 0,
    reposted: false,
    likes: 0,
    zappers: null,
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
      const unsub = Events.getRepliesAndReactions(event.id, (...args) =>
        handleRepliesAndReactions(...args),
      );
      return () => {
        unsub();
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
    like(!state.liked);
  }

  function repostBtnClicked() {
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
    setState({ ...state, showLikes: !state.showLikes, showZaps: false, showReposts: false });
  }

  function toggleReposts(e) {
    e.stopPropagation();
    setState({ ...state, showReposts: !state.showReposts, showZaps: false, showLikes: false });
  }

  function toggleZaps(e) {
    e.stopPropagation();
    setState({ ...state, showZaps: !state.showZaps, showReposts: false, showLikes: false });
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
    const zappers =
      zaps && Array.from(zaps.values()).map((eventId) => Events.getZappingUser(eventId));

    props.setReplies(sortedReplies);

    setState({
      ...state,
      reposts: repostedBy.size,
      reposted: repostedBy.has(myPub),
      likes: likedBy.size,
      zappers,
      liked: likedBy.has(myPub),
      likedBy,
      repostedBy,
      replyCount: threadReplyCount,
    });
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
      <div className="below-text">
        <a className="msg-btn reply-btn" onClick={() => replyBtnClicked()}>
          {Icons.reply}
        </a>
        <span className="count">{s.replyCount || ''}</span>
        <a
          className={`msg-btn repost-btn ${s.reposted ? 'reposted' : ''}`}
          onClick={() => repostBtnClicked()}
        >
          {Icons.repost}
        </a>
        <span
          className={`count ${s.showReposts ? 'active' : ''}`}
          onClick={(e) => toggleReposts(e)}
        >
          {s.reposts || ''}
        </span>
        <a
          className={`msg-btn like-btn ${s.liked ? 'liked' : ''}`}
          onClick={(e) => likeBtnClicked(e)}
        >
          {s.liked ? Icons.heartFull : Icons.heartEmpty}
        </a>
        <span className={`count ${s.showLikes ? 'active' : ''}`} onClick={(e) => toggleLikes(e)}>
          {s.likes || ''}
        </span>
        {state.lightning ? (
          <>
            <a
              onClick={(e) => {
                e.preventDefault();
                setState({ ...state, showZapModal: true });
              }}
              className="msg-btn zap-btn"
            >
              {Icons.lightning}
            </a>
            <span className={`count ${s.showZaps ? 'active' : ''}`} onClick={(e) => toggleZaps(e)}>
              {s.zappers?.length || ''}
            </span>
          </>
        ) : (
          ''
        )}
      </div>
    );
  }

  function renderZapModal() {
    return (
      <ZapModal
        show={true}
        lnurl={state.lightning}
        note={props.event.id}
        recipient={props.event.pubkey}
        onClose={() => setState({ ...state, showZapModal: false })}
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

export default Reactions;
