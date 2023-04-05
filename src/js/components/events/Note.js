import { Helmet } from 'react-helmet';
import $ from 'jquery';
import { route } from 'preact-router';
import styled from 'styled-components';

import Component from '../../BaseComponent';
import Helpers from '../../Helpers';
import Icons from '../../Icons';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation';
import Block from '../buttons/Block';
import Copy from '../buttons/Copy';
import Follow from '../buttons/Follow';
import Dropdown from '../Dropdown';
import FeedMessageForm from '../FeedMessageForm';
import Identicon from '../Identicon';
import Modal from '../modal/Modal';
import ZapModal from '../modal/Zap';
import Name from '../Name';
import SafeImg from '../SafeImg';
import Torrent from '../Torrent';

import EventComponent from './EventComponent';

const MSG_TRUNCATE_LENGTH = 500;
const MSG_TRUNCATE_LINES = 8;

const replyIcon = (
  <svg width="24" viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M12,1C5.4,1,0,5.5,0,11c0,2.8,1.4,5.5,4,7.4l-1.9,3.9C2,22.5,2,22.7,2.2,22.8C2.3,22.9,2.4,23,2.5,23c0.1,0,0.2,0,0.3-0.1
L7,20.1c1.6,0.6,3.3,0.9,5,0.9c6.6,0,12-4.5,12-10S18.6,1,12,1z M12,19.5c-1.6,0-3.2-0.3-4.6-0.9c-0.1-0.1-0.3,0-0.4,0l-2.7,1.8
l1.2-2.4c0.1-0.2,0-0.5-0.2-0.6c-2.3-1.6-3.7-4-3.7-6.5c0-4.7,4.7-8.5,10.4-8.5S22.4,6.4,22.4,11S17.7,19.5,12,19.5z"
    />
  </svg>
);

let loadRepliesAndReactions = true;
localState
  .get('settings')
  .get('loadRepliesAndReactions')
  .on((v) => (loadRepliesAndReactions = v));

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
`;

class Note extends Component {
  constructor() {
    super();
    this.i = 0;
    this.likedBy = new Set();
    this.state = {
      sortedReplies: [],
      content: '',
      replyingToUsers: [],
      title: '',
      shortText: '',
      quotedShortText: '',
    };
    this.subscriptions = [];
  }

  likeBtnClicked(e) {
    e.preventDefault();
    this.like(!this.state.liked);
  }

  repostBtnClicked() {
    if (!this.state.reposted) {
      const author = this.props.event.pubkey;
      const hexId = Key.toNostrHexAddress(this.props.event.id);
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

  like(liked = true) {
    if (liked) {
      const author = this.props.event.pubkey;

      const hexId = Key.toNostrHexAddress(this.props.event.id);
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

  onDelete(e) {
    e.preventDefault();
    if (confirm('Delete message?')) {
      const hexId = Key.toNostrHexAddress(this.props.event.id);
      if (hexId) {
        Events.publish({
          kind: 5,
          content: 'deleted',
          tags: [['e', hexId]],
        });
        this.setState({ msg: null });
      }
    }
  }

  onBroadcast(e) {
    // republish message on nostr
    e.preventDefault();
    const hexId = Key.toNostrHexAddress(this.props.event.id);
    if (hexId) {
      const event = Events.db.by('id', hexId);
      if (event) {
        // TODO indicate to user somehow
        console.log('broadcasting', hexId);
        Events.publish(event);
      }
    }
  }

  imageClicked(event) {
    event.preventDefault();
    this.setState({ showImageModal: true });
  }

  messageClicked(event) {
    if (this.props.standalone) {
      return;
    }
    if (['A', 'BUTTON', 'TEXTAREA', 'IMG', 'INPUT'].find((tag) => event.target.closest(tag))) {
      return;
    }
    if (window.getSelection().toString()) {
      return;
    }
    event.stopPropagation();
    if (this.props.event.kind === 7) {
      const likedId = this.props.event.tags?.reverse().find((t) => t[0] === 'e')[1];
      return route(`/${likedId}`);
    }
    this.openStandalone();
  }

  openStandalone() {
    route(`/${Key.toNostrBech32Address(this.props.event.id, 'note')}`);
  }

  replyBtnClicked() {
    if (this.props.standalone) {
      $(document).find('textarea').focus();
    } else {
      this.openStandalone();
    }
  }

  onMute(e) {
    e.preventDefault();
    localState.get('mutedNotes').get(this.hexId).put(!this.state.muted);
  }

  report(e) {
    e.preventDefault();
    if (confirm('Publicly report and hide message?')) {
      const hexId = Key.toNostrHexAddress(this.props.event.id);
      if (hexId) {
        Events.publish({
          kind: 5,
          content: 'reported',
          tags: [
            ['e', hexId],
            ['p', this.props.event.pubkey],
          ],
        });
        this.setState({ msg: null });
      }
    }
  }

  translate(e) {
    e.preventDefault();
    Helpers.translateText(this.props.event.content).then((res) => {
      this.setState({ translatedText: res.translatedText });
    });
  }

  renderDropdown() {
    // maybe this should be rendered only when it's opened?
    if (this.props.asInlineQuote) {
      return '';
    }
    const event = this.props.event;
    const url = `https://iris.to/${Key.toNostrBech32Address(event.id, 'note')}`;
    return (
      <div className="msg-menu-btn">
        <Dropdown>
          <Copy
            key={`${event.id}copy_link`}
            text={t('copy_link')}
            title="Note link"
            copyStr={url}
          />
          <Copy
            key={`${event.id}copy_id`}
            text={t('copy_note_ID')}
            title="Note ID"
            copyStr={Key.toNostrBech32Address(event.id, 'note')}
          />
          <a href="#" onClick={(e) => this.onMute(e)}>
            {this.state.muted ? t('unmute') : t('mute')}
          </a>
          {event ? (
            <>
              <a href="#" onClick={(e) => this.onBroadcast(e)}>
                {t('resend_to_relays')}
              </a>
              <a href="#" onClick={(e) => this.translate(e)}>
                {t('translate')}
              </a>
              <Copy
                key={`${event.id}copyRaw`}
                text={t('copy_raw_data')}
                title="Message raw data"
                copyStr={JSON.stringify(event, null, 2)}
              />
              {this.props.meta.isMine ? (
                <a href="#" onClick={(e) => this.onDelete(e)}>
                  {t('delete')}
                </a>
              ) : (
                <>
                  <a href="#" onClick={(e) => this.report(e)}>
                    {t('report_public')}
                  </a>
                  <Follow id={event?.pubkey} showName={true} />
                  <span onClick={() => this.setState({ msg: null })}>
                    <Block id={event?.pubkey} showName={true} />
                  </span>
                </>
              )}
            </>
          ) : null}
        </Dropdown>
      </div>
    );
  }

  toggleLikes(e) {
    console.log('toggle likes');
    e.stopPropagation();
    this.setState({ showLikes: !this.state.showLikes, showZaps: false, showreposts: false });
  }

  toggleReposts(e) {
    e.stopPropagation();
    this.setState({ showReposts: !this.state.showReposts, showZaps: false, showLikes: false });
  }

  toggleZaps(e) {
    e.stopPropagation();
    this.setState({ showZaps: !this.state.showZaps, showReposts: false, showLikes: false });
  }

  componentDidMount() {
    const event = this.props.event;
    const unsub = SocialNetwork.getProfile(event.pubkey, (profile) => {
      if (!profile) return;
      let lightning = profile.lud16 || profile.lud06;
      this.setState({
        lightning,
        name: profile.display_name || profile.name,
      });
    });
    this.subscriptions.push(unsub);
    if (loadRepliesAndReactions !== false) {
      const unsub2 = Events.getRepliesAndReactions(event.id, (...args) =>
        this.handleRepliesAndReactions(...args),
      );
      this.subscriptions.push(unsub2);
    }

    // find .jpg .jpeg .gif .png .webp urls in msg.text and add them to msg.attachments
    let text = this.props.event.content;
    const meta = this.props.meta || {};
    meta.attachments = [];
    const urls = text.match(/(https?:\/\/[^\s]+)/g);
    if (urls) {
      urls.forEach((url) => {
        let parsedUrl;
        try {
          parsedUrl = new URL(url);
        } catch (e) {
          console.log('invalid url', url);
          return;
        }
        if (parsedUrl.pathname.toLowerCase().match(/\.(jpg|jpeg|gif|png|webp)$/)) {
          meta.attachments.push({ type: 'image', data: `${parsedUrl.href}` });
        }
      });
    }
    const ogImageUrl =
      this.props.standalone && this.props.meta.attachments?.find((a) => a.type === 'image')?.data;

    let name = this.props.name || this.state.name;
    const emojiOnly =
      this.props.event.content?.length === 2 && Helpers.isEmoji(this.props.event.content);
    const shortText = text.length > 128 ? `${text.slice(0, 128)}...` : text;
    const quotedShortText = `"${shortText}"`;

    const content = Helpers.highlightEverything(text.trim(), this.props.event, {
      showMentionedMessages: !this.props.asInlineQuote,
      onImageClick: (e) => this.imageClicked(e),
    });
    text =
      text.length > MSG_TRUNCATE_LENGTH && !this.state.showMore && !this.props.standalone
        ? `${text.slice(0, MSG_TRUNCATE_LENGTH)}...`
        : text;

    const lines = text.split('\n');
    text =
      lines.length > MSG_TRUNCATE_LINES && !this.state.showMore && !this.props.standalone
        ? `${lines.slice(0, MSG_TRUNCATE_LINES).join('\n')}...`
        : text;

    const shortContent =
      this.isTooLong() &&
      Helpers.highlightEverything(text.trim(), this.props.event, {
        showMentionedMessages: !this.props.asInlineQuote,
        onImageClick: (e) => this.imageClicked(e),
      });

    const time = new Date(this.props.event.created_at * 1000);
    const dateStr = time.toLocaleString(window.navigator.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = time.toLocaleTimeString(window.navigator.language, {
      timeStyle: 'short',
    });

    let rootMsg = Events.getEventRoot(this.props.event);
    if (!rootMsg) {
      rootMsg = this.props.meta.replyingTo;
    }

    let replyingToUsers = [];
    const hasETags = this.props.event.tags?.some((t) => t[0] === 'e');
    if (hasETags) {
      replyingToUsers = this.props.event?.tags.filter((t) => t[0] === 'p').map((t) => t[1]);
    }
    // remove duplicates
    replyingToUsers = [...new Set(replyingToUsers)];

    this.setState({
      meta,
      content,
      shortContent,
      replyingToUsers,
      ogImageUrl,
      time,
      timeStr,
      dateStr,
      rootMsg,
      shortText,
      quotedShortText,
      emojiOnly,
      name,
      text,
      lines,
    });
  }

  handleRepliesAndReactions(replies, likedBy, threadReplyCount, repostedBy, zaps) {
    // zaps.size &&
    //  console.log('zaps.size', zaps.size, Key.toNostrBech32Address(event.id, 'note'));
    this.likedBy = likedBy;
    this.repostedBy = repostedBy;
    const myPub = Key.getPubKey();
    const sortedReplies =
      replies &&
      Array.from(replies).sort((a, b) => {
        const eventA = Events.db.by('id', a);
        const eventB = Events.db.by('id', b);
        // show our replies first
        if (eventA?.pubkey === myPub && eventB?.pubkey !== myPub) {
          return -1;
        } else if (eventA?.pubkey !== myPub && eventB?.pubkey === myPub) {
          return 1;
        }
        // show replies by original post's author first
        if (eventA?.pubkey === this.event?.pubkey && eventB?.pubkey !== this.event?.pubkey) {
          return -1;
        } else if (eventA?.pubkey !== this.event?.pubkey && eventB?.pubkey === this.event?.pubkey) {
          return 1;
        }
        return eventA?.created_at - eventB?.created_at;
      });
    const zappers =
      zaps && Array.from(zaps.values()).map((eventId) => Events.getZappingUser(eventId));

    this.setState({
      reposts: this.repostedBy.size,
      reposted: this.repostedBy.has(myPub),
      likes: this.likedBy.size,
      zappers,
      liked: this.likedBy.has(myPub),
      replyCount: threadReplyCount,
      sortedReplies,
    });
  }

  renderLikes() {
    return (
      <div className="likes">
        {Array.from(this.likedBy).map((key) => {
          const npub = Key.toNostrBech32Address(key, 'npub');
          return (
            <Identicon showTooltip={true} onClick={() => route(`/${npub}`)} str={npub} width="32" />
          );
        })}
      </div>
    );
  }

  renderReplyingTo() {
    return (
      <small className="msg-replying-to">
        {t('replying_to') + ' '}
        {this.state.replyingToUsers.slice(0, 3).map((u) => (
          <a href={`/${Key.toNostrBech32Address(u, 'npub')}`}>
            @<Name pub={u} hideBadge={true} userNameOnly={true} />{' '}
          </a>
        ))}
        {this.state.replyingToUsers?.length > 3 ? '...' : ''}
      </small>
    );
  }

  renderHelmet() {
    const s = this.state;
    const title = `${s.name || 'User'} on Iris`;
    return (
      <Helmet titleTemplate="%s">
        <title>{`${title}: ${s.quotedShortText}`}</title>
        <meta name="description" content={s.quotedShortText} />
        <meta property="og:type" content="article" />
        {s.ogImageUrl ? <meta property="og:image" content={s.ogImageUrl} /> : null}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={s.quotedShortText} />
      </Helmet>
    );
  }

  renderReactionBtns() {
    const s = this.state;
    return (
      <div className="below-text">
        <a className="msg-btn reply-btn" onClick={() => this.replyBtnClicked()}>
          {replyIcon}
        </a>
        <span className="count">{s.replyCount || ''}</span>
        <a
          className={`msg-btn repost-btn ${s.reposted ? 'reposted' : ''}`}
          onClick={() => this.repostBtnClicked()}
        >
          {Icons.repost}
        </a>
        <span
          className={`count ${s.showReposts ? 'active' : ''}`}
          onClick={(e) => this.toggleReposts(e)}
        >
          {s.reposts || ''}
        </span>
        <a
          className={`msg-btn like-btn ${s.liked ? 'liked' : ''}`}
          onClick={(e) => this.likeBtnClicked(e)}
        >
          {s.liked ? Icons.heartFull : Icons.heartEmpty}
        </a>
        <span
          className={`count ${s.showLikes ? 'active' : ''}`}
          onClick={(e) => this.toggleLikes(e)}
        >
          {s.likes || ''}
        </span>
        {this.state.lightning ? (
          <>
            <a
              onClick={(e) => {
                e.preventDefault();
                this.setState({ showZapModal: true });
              }}
              className="msg-btn zap-btn"
            >
              {Icons.lightning}
            </a>
            <span
              className={`count ${s.showZaps ? 'active' : ''}`}
              onClick={(e) => this.toggleZaps(e)}
            >
              {s.zappers?.length || ''}
            </span>
          </>
        ) : (
          ''
        )}
      </div>
    );
  }

  renderImageModal() {
    return (
      <Modal centerVertically={false} onClose={() => this.setState({ showImageModal: false })}>
        <ContentContainer>
          {this.props.meta.attachments.map((a) => {
            return (
              <p>
                <SafeImg style={{ maxHeight: '90vh', maxWidth: '90vw' }} src={a.data} />
              </p>
            );
          })}
        </ContentContainer>
      </Modal>
    );
  }

  renderZapModal() {
    return (
      <ZapModal
        show={true}
        lnurl={this.state.lightning}
        note={this.props.event.id}
        recipient={this.props.event.pubkey}
        onClose={() => this.setState({ showZapModal: false })}
      />
    );
  }

  renderReplies() {
    return this.state.sortedReplies
      .slice(0, this.props.showReplies)
      .map((r) => (
        <EventComponent
          key={r}
          id={r}
          asReply={!this.props.standalone}
          showReplies={1}
          showRepliedMsg={false}
        />
      ));
  }

  renderReplyForm() {
    return (
      <FeedMessageForm
        waitForFocus={true}
        autofocus={!this.props.standalone}
        replyingTo={this.props.event.id}
        replyingToUser={this.props.event.pubkey}
        placeholder={t('write_your_reply')}
      />
    );
  }

  renderZaps() {
    return (
      <div className="likes">
        {(this.state.zappers || []).map((npub) => {
          return (
            <Identicon showTooltip={true} onClick={() => route(`/${npub}`)} str={npub} width="32" />
          );
        })}
      </div>
    );
  }

  renderShowThread() {
    return (
      <div style={{ flexBasis: '100%', marginBottom: '12px' }}>
        <a href={`/${Key.toNostrBech32Address(this.state.rootMsg, 'note')}`}>{t('show_thread')}</a>
      </div>
    );
  }

  renderRepliedMsg() {
    return (
      <EventComponent
        key={this.props.event.id + this.props.meta.replyingTo}
        id={this.props.meta.replyingTo}
        asQuote={true}
        showReplies={0}
      />
    );
  }

  renderReposts() {
    return (
      <div className="likes">
        {Array.from(this.repostedBy).map((key) => {
          const npub = Key.toNostrBech32Address(key, 'npub');
          return (
            <Identicon showTooltip={true} onClick={() => route(`/${npub}`)} str={npub} width="32" />
          );
        })}
      </div>
    );
  }

  isTooLong() {
    return (
      this.props.meta.attachments?.length > 1 ||
      this.props.event.content?.length > MSG_TRUNCATE_LENGTH ||
      this.props.event.content.split('\n').length > MSG_TRUNCATE_LINES
    );
  }

  renderIdenticon(asQuote) {
    return (
      <div className="msg-identicon">
        {this.props.event.pubkey ? (
          <a href={`/${this.props.event.pubkey}`}>
            <Identicon str={Key.toNostrBech32Address(this.props.event.pubkey, 'npub')} width="40" />
          </a>
        ) : (
          ''
        )}
        {(asQuote && !this.props.standalone && <div className="line"></div>) || ''}
      </div>
    );
  }

  renderMsgSender() {
    const s = this.state;
    return (
      <div className="msg-sender">
        <div className="msg-sender-link">
          <a
            href={`/${Key.toNostrBech32Address(this.props.event.pubkey, 'npub')}`}
            className="msgSenderName"
          >
            <Name pub={this.props.event.pubkey} />
          </a>
          <div className="time">
            {'· '}
            <a
              href={`/${Key.toNostrBech32Address(this.props.event.id, 'note')}`}
              className="tooltip"
            >
              {s.time && Helpers.getRelativeTimeText(s.time)}
              <span className="tooltiptext">
                {' '}
                {s.dateStr} {s.timeStr}{' '}
              </span>
            </a>
          </div>
        </div>
        {this.renderDropdown()}
      </div>
    );
  }

  getClassName(asQuote, quoting) {
    const { props } = this;
    const classNames = ['msg'];

    if (props.asReply) classNames.push('reply');
    if (props.standalone) classNames.push('standalone');
    if (asQuote) classNames.push('quote');
    if (quoting) classNames.push('quoting');
    if (props.asInlineQuote) classNames.push('inline-quote');

    return classNames.join(' ');
  }

  render() {
    if (!this.props.event && this.props.meta) {
      return null;
    }
    const s = this.state;
    const asQuote = this.props.asQuote || (this.props.showReplies && s.sortedReplies.length);
    const quoting = this.props.meta.replyingTo && (this.props.showRepliedMsg || this.props.asReply);

    return (
      <>
        {this.props.meta.replyingTo && this.props.showRepliedMsg && this.renderRepliedMsg()}
        <div
          key={this.props.event.id + 'note'}
          ref={this.ref}
          className={this.getClassName(asQuote, quoting)}
          onClick={(e) => this.messageClicked(e)}
        >
          <div className="msg-content" onClick={(e) => this.messageClicked(e)}>
            {this.props.asQuote && this.state.rootMsg && this.renderShowThread()}
            {this.renderIdenticon(asQuote)}
            <div className="msg-main">
              {this.renderMsgSender()}
              {(s.replyingToUsers?.length && !quoting && this.renderReplyingTo()) || null}
              {this.props.standalone && this.renderHelmet()}
              {this.props.meta.torrentId && (
                <Torrent torrentId={this.props.meta.torrentId} autopause={!this.props.standalone} />
              )}
              {s.text?.length > 0 && (
                <div className={`text ${s.emojiOnly && 'emoji-only'}`}>
                  {(!this.state.showMore && this.state.shortContent) || this.state.content}
                  {s.translatedText && (
                    <p>
                      <i>{s.translatedText}</i>
                    </p>
                  )}
                </div>
              )}
              {!this.props.standalone && this.state.shortContent && (
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    this.setState({ showMore: !s.showMore });
                  }}
                >
                  {t(`show_${s.showMore ? 'less' : 'more'}`)}
                </a>
              )}
              {!this.props.asInlineQuote && this.renderReactionBtns()}
              {s.showLikes && this.renderLikes()}
              {s.showZaps && this.renderZaps()}
              {s.showReposts && this.renderReposts()}
              {s.lightning && s.showZapModal && this.renderZapModal()}
              {s.showImageModal && this.renderImageModal()}
              {this.props.standalone || s.showReplyForm ? this.renderReplyForm() : ''}
            </div>
          </div>
        </div>
        {(this.props.showReplies || s.showReplyForm) && s.sortedReplies?.length
          ? this.renderReplies()
          : ''}
      </>
    );
  }
}

export default Note;
