import { Helmet } from 'react-helmet';
import { route } from 'preact-router';

import Component from '../../BaseComponent';
import Helpers from '../../Helpers';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation';
import FeedMessageForm from '../FeedMessageForm';
import Identicon from '../Identicon';
import ImageModal from '../modal/Image';
import Name from '../Name';
import Torrent from '../Torrent';

import EventComponent from './EventComponent';
import EventDropdown from './EventDropdown';
import Reactions from './Reactions';

const MSG_TRUNCATE_LENGTH = 500;
const MSG_TRUNCATE_LINES = 8;

let loadReactions = true;
localState
  .get('settings')
  .get('loadReactions')
  .on((v) => (loadReactions = v));

class Note extends Component {
  constructor() {
    super();
    this.i = 0;
    this.likedBy = new Set();
    this.state = {
      replies: [],
      content: '',
      replyingToUsers: [],
      title: '',
      shortText: '',
      quotedShortText: '',
    };
    this.subscriptions = [];
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

  renderDropdown() {
    return this.props.asInlineQuote ? null : (
      <EventDropdown id={this.props.event.id} event={this.props.event} />
    );
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

  renderImageModal() {
    const images = this.props.meta.attachments?.map((a) => a.data);
    return <ImageModal images={images} onClose={() => this.setState({ showImageModal: false })} />;
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

  renderReplies() {
    return this.state.replies
      .slice(0, this.props.showReplies)
      .map((r) => (
        <EventComponent key={r} id={r} asReply={!this.props.standalone} showReplies={true} />
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

  render() {
    if (!this.props.event && this.props.meta) {
      return null;
    }
    const s = this.state;
    const asQuote = this.props.asQuote || (this.props.showReplies && s.replies.length);
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
              {!this.props.asInlineQuote && loadReactions && (
                <Reactions
                  standalone={this.props.standalone}
                  event={this.props.event}
                  setReplies={(replies) => this.setState({ replies })}
                />
              )}
              {s.showImageModal && this.renderImageModal()}
              {this.props.standalone || s.showReplyForm ? this.renderReplyForm() : ''}
            </div>
          </div>
        </div>
        {((this.props.showReplies || s.showReplyForm) &&
          s.replies?.length &&
          this.renderReplies()) ||
          ''}
      </>
    );
  }
}

export default Note;
