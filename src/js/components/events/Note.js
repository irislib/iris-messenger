import { Helmet } from 'react-helmet';
import { html } from 'htm/preact';
import $ from 'jquery';
import { escapeRegExp } from 'lodash';
import { route } from 'preact-router';

import AnimalName from '../../AnimalName';
import Component from '../../BaseComponent';
import Helpers from '../../Helpers';
import Icons from '../../Icons';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation';
import BlockButton from '../BlockButton';
import CopyButton from '../CopyButton';
import Dropdown from '../Dropdown';
import FeedMessageForm from '../FeedMessageForm';
import FollowButton from '../FollowButton';
import Identicon from '../Identicon';
import Name from '../Name';
import SafeImg from '../SafeImg';
import Torrent from '../Torrent';

import EventComponent from './EventComponent';

const MSG_TRUNCATE_LENGTH = 500;
const MSG_TRUNCATE_LINES = 8;

const ANIMATE_DURATION = 200;

const replyIcon = html`<svg width="24" viewBox="0 0 24 24" fill="currentColor">
  <path
    d="M12,1C5.4,1,0,5.5,0,11c0,2.8,1.4,5.5,4,7.4l-1.9,3.9C2,22.5,2,22.7,2.2,22.8C2.3,22.9,2.4,23,2.5,23c0.1,0,0.2,0,0.3-0.1
L7,20.1c1.6,0.6,3.3,0.9,5,0.9c6.6,0,12-4.5,12-10S18.6,1,12,1z M12,19.5c-1.6,0-3.2-0.3-4.6-0.9c-0.1-0.1-0.3,0-0.4,0l-2.7,1.8
l1.2-2.4c0.1-0.2,0-0.5-0.2-0.6c-2.3-1.6-3.7-4-3.7-6.5c0-4.7,4.7-8.5,10.4-8.5S22.4,6.4,22.4,11S17.7,19.5,12,19.5z"
  />
</svg>`;

const lightningIcon = html`<svg width="24" height="20" viewBox="0 0 16 20" fill="none">
  <path
    d="M8.8333 1.70166L1.41118 10.6082C1.12051 10.957 0.975169 11.1314 0.972948 11.2787C0.971017 11.4068 1.02808 11.5286 1.12768 11.6091C1.24226 11.7017 1.46928 11.7017 1.92333 11.7017H7.99997L7.16663 18.3683L14.5888 9.46178C14.8794 9.11297 15.0248 8.93857 15.027 8.79128C15.0289 8.66323 14.9719 8.54141 14.8723 8.46092C14.7577 8.36833 14.5307 8.36833 14.0766 8.36833H7.99997L8.8333 1.70166Z"
    stroke="currentColor"
    stroke-width="1.66667"
    stroke-linecap="round"
    stroke-linejoin="round"
  ></path>
</svg>`;

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
      const event = Events.cache.get(hexId);
      if (event) {
        // TODO indicate to user somehow
        console.log('broadcasting', hexId);
        Events.publish(event);
      }
    }
  }

  imageClicked(event) {
    event.preventDefault();
    this.openAttachmentsGallery(event);
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
    if (this.props.asInlineQuote) {
      return '';
    }
    const url = `https://iris.to/${Key.toNostrBech32Address(this.props.event.id, 'note')}`;
    return html`
      <div class="msg-menu-btn">
        <${Dropdown}>
          <${CopyButton}
            key=${`${this.props.event.id}copy_link`}
            text=${t('copy_link')}
            title="Note link"
            copyStr=${url}
          />
          <${CopyButton}
            key=${`${this.props.event.id}copy_id`}
            text=${t('copy_note_ID')}
            title="Note ID"
            copyStr=${Key.toNostrBech32Address(this.props.event.id, 'note')}
          />
          <a href="#" onClick=${(e) => this.onMute(e)}>
            ${this.state.muted ? t('unmute') : t('mute')}
          </a>
          ${this.props.event
            ? html`
                <a href="#" onClick=${(e) => this.onBroadcast(e)}>${t('resend_to_relays')}</a>
                <a href="#" onClick=${(e) => this.translate(e)}>${t('translate')}</a>
                <${CopyButton}
                  key=${`${this.props.event.id}copyRaw`}
                  text=${t('copy_raw_data')}
                  title="Message raw data"
                  copyStr=${JSON.stringify(this.props.event, null, 2)}
                />
                ${this.props.meta.isMine
                  ? html` <a href="#" onClick=${(e) => this.onDelete(e)}>${t('delete')}</a> `
                  : html`<a href="#" onClick=${(e) => this.report(e)}>${t('report_public')}</a>
                      <${FollowButton} id=${this.props.event?.pubkey} showName=${true} />
                      <span onClick=${() => this.setState({ msg: null })}>
                        <${BlockButton} id=${this.props.event?.pubkey} showName=${true} />
                      </span> `}
              `
            : ''}
        <//>
      </div>
    `;
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
      if (lightning && !lightning.startsWith('lightning:')) {
        lightning = `lightning:${lightning}`;
      }
      this.setState({ lightning });
    });
    this.subscriptions.push(unsub);
    const unsub2 = Events.getRepliesAndReactions(event.id, (...args) =>
      this.handleRepliesAndReactions(...args),
    );
    this.subscriptions.push(unsub2);

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

          // Remove URL from beginning or end of line or before newline
          const esc = escapeRegExp(url);
          text = text.replace(new RegExp(`^${esc}`), '');
          text = text.replace(new RegExp(`${esc}$`), '');
          text = text.replace(new RegExp(`${esc}\n`), ' ');
        }
      });
    }
    const ogImageUrl =
      this.props.standalone && this.props.meta.attachments?.find((a) => a.type === 'image')?.data;

    const isThumbnail = this.props.thumbnail ? 'thumbnail-item' : '';
    let name = this.props.name || this.state.name || AnimalName(this.props.event.pubkey);
    const emojiOnly =
      this.props.event.content?.length === 2 && Helpers.isEmoji(this.props.event.content);
    const shortText = text.length > 128 ? `${text.slice(0, 128)}...` : text;
    const quotedShortText = `"${shortText}"`;
    if (isThumbnail) {
      text = shortText;
    }
    const title = `${name || 'User'} on Iris`;

    const content = Helpers.highlightEverything(text.trim(), this.props.event, {
      showMentionedMessages: !this.props.asInlineQuote,
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

    let rootMsg = this.props.event?.tags.find((t) => t[0] === 'e' && t[3] === 'root')?.[1];
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
      title,
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
        const eventA = Events.cache.get(a);
        const eventB = Events.cache.get(b);
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
    return html`
      <div class="likes">
        ${Array.from(this.likedBy).map((key) => {
          const npub = Key.toNostrBech32Address(key, 'npub');
          return html`<${Identicon}
            showTooltip=${true}
            onClick=${() => route(`/${npub}`)}
            str=${npub}
            width="32"
          />`;
        })}
      </div>
    `;
  }

  renderReplyingTo() {
    return html`
      <small class="msg-replying-to">
        ${t('replying_to') + ' '}
        ${this.state.replyingToUsers
          .slice(0, 3)
          .map(
            (u) => html`
              <a href=${`/${Key.toNostrBech32Address(u, 'npub')}`}>
                @<${Name} pub=${u} hideBadge=${true} userNameOnly=${true} />${' '}
              </a>
            `,
          )}
        ${this.state.replyingToUsers?.length > 3 ? '...' : ''}
      </small>
    `;
  }

  renderHelmet() {
    const s = this.state;
    return html`
      <${Helmet} titleTemplate="%s">
        <title>${s.title}: ${s.quotedShortText}</title>
        <meta name="description" content=${s.quotedShortText} />
        <meta property="og:type" content="article" />
        ${s.ogImageUrl ? html`<meta property="og:image" content=${s.ogImageUrl} />` : ''}
        <meta property="og:title" content=${s.title} />
        <meta property="og:description" content=${s.quotedShortText} />
      <//>
    `;
  }

  renderReactionBtns() {
    const s = this.state;
    return html`
      <div class="below-text">
        <a class="msg-btn reply-btn" onClick=${() => this.replyBtnClicked()}> ${replyIcon} </a>
        <span class="count"> ${s.replyCount || ''} </span>
        <a
          class="msg-btn repost-btn ${s.reposted ? 'reposted' : ''}"
          onClick=${() => this.repostBtnClicked()}
        >
          ${Icons.repost}
        </a>
        <span
          class="count ${s.showReposts ? 'active' : ''}"
          onClick=${(e) => this.toggleReposts(e)}
        >
          ${s.reposts || ''}
        </span>
        <a
          class="msg-btn like-btn ${s.liked ? 'liked' : ''}"
          onClick=${(e) => this.likeBtnClicked(e)}
        >
          ${s.liked ? Icons.heartFull : Icons.heartEmpty}
        </a>
        <span class="count ${s.showLikes ? 'active' : ''}" onClick=${(e) => this.toggleLikes(e)}>
          ${s.likes || ''}
        </span>
        ${this.state.lightning
          ? html`
              <a
                href=${this.state.lightning}
                onClick=${(e) => Helpers.handleLightningLinkClick(e)}
                class="msg-btn zap-btn"
              >
                ${lightningIcon}
              </a>
              <span
                class="count ${s.showZaps ? 'active' : ''}"
                onClick=${(e) => this.toggleZaps(e)}
              >
                ${s.zappers?.length || ''}
              </span>
            `
          : ''}
      </div>
    `;
  }

  renderReplies() {
    return this.state.sortedReplies
      .slice(0, this.props.showReplies)
      .map(
        (r) =>
          html`<${EventComponent}
            key=${r}
            id=${r}
            asReply=${!this.props.standalone}
            showName=${true}
            showReplies=${1}
            showRepliedMsg=${false}
          />`,
      );
  }

  renderReplyForm() {
    return html`
      <${FeedMessageForm}
        waitForFocus=${true}
        autofocus=${!this.props.standalone}
        replyingTo=${this.props.event.id}
        replyingToUser=${this.props.event.pubkey}
        placeholder=${t('write_your_reply')}
      />
    `;
  }

  renderZaps() {
    return html`
      <div class="likes">
        ${(this.state.zappers || []).map((npub) => {
          return html`<${Identicon}
            showTooltip=${true}
            onClick=${() => route(`/${npub}`)}
            str=${npub}
            width="32"
          />`;
        })}
      </div>
    `;
  }

  renderShowThread() {
    return html` <div style="flex-basis:100%; margin-bottom: 12px">
      <a href="/${Key.toNostrBech32Address(this.state.rootMsg, 'note')}"
        >${t('show_thread')}</a
      >
    </div>`;
  }

  renderRepliedMsg() {
    return html`
      <${EventComponent}
        key=${this.props.meta.replyingTo}
        id=${this.props.meta.replyingTo}
        asQuote=${true}
        showName=${true}
        showReplies=${0}
      />
    `;
  }

  renderReposts() {
    return html`
      <div class="likes">
        ${Array.from(this.repostedBy).map((key) => {
          const npub = Key.toNostrBech32Address(key, 'npub');
          return html`<${Identicon}
            showTooltip=${true}
            onClick=${() => route(`/${npub}`)}
            str=${npub}
            width="32"
          />`;
        })}
      </div>
    `;
  }

  renderAttachments() {
    return this.props.meta.attachments.map((a, i) => {
      if (i > 0 && !this.props.standalone && !this.state.showMore) {
        return;
      }
      return html`<div class="img-container">
        <${SafeImg}
          width=${569}
          src=${a.data}
          onClick=${(e) => {
            this.imageClicked(e);
          }}
        />
      </div>`;
    });
  }

  isTooLong() {
    return (
      this.props.meta.attachments?.length > 1 ||
      this.props.event.content?.length > MSG_TRUNCATE_LENGTH ||
      this.props.event.content.split('\n').length > MSG_TRUNCATE_LINES
    );
  }

  render() {
    if (!this.props.event && this.props.meta) {
      return '';
    }
    const s = this.state;
    const asQuote = this.props.asQuote || (this.props.showReplies && s.sortedReplies.length);
    const quoting = this.props.meta.replyingTo && (this.props.showRepliedMsg || this.props.asReply);

    return html`
      ${this.props.meta.replyingTo && this.props.showRepliedMsg ? this.renderRepliedMsg() : ''}
      <div
        key=${this.props.event.id}
        ref=${this.ref}
        class="msg ${s.isThumbnail ? 'thumbnail' : ''} ${this.props.asReply ? 'reply' : ''} ${this
          .props.standalone
          ? 'standalone'
          : ''} ${asQuote ? 'quote' : ''}
          ${quoting ? 'quoting' : ''}
        ${this.props.asInlineQuote ? 'inline-quote' : ''}"
      >
        <div class="msg-content" onClick=${(e) => this.messageClicked(e)}>
          ${this.props.asQuote && this.state.rootMsg ? this.renderShowThread() : ''}
          <div class="msg-identicon">
            ${this.props.event.pubkey
              ? html`
                  <a href=${`/${this.props.event.pubkey}`}>
                    <${Identicon} str=${this.props.event.pubkey} width="40" />
                  </a>
                `
              : ''}
            ${asQuote && !this.props.standalone ? html`<div class="line"></div>` : ''}
          </div>
          <div class="msg-main">
            <div class="msg-sender">
              <div class="msg-sender-link">
                ${this.props.showName &&
                html`
                  <a href=${`/${Key.toNostrBech32Address(this.props.event.pubkey, 'npub')}`} class="msgSenderName">
                    <${Name} pub=${this.props.event.pubkey} />
                  </a>
                `}
                <div class="time">
                  ${'· '}
                  <a
                    href=${`/${Key.toNostrBech32Address(this.props.event.id, 'note')}`}
                    class="tooltip"
                  >
                    ${s.time && Helpers.getRelativeTimeText(s.time)}
                    <span class="tooltiptext"> ${s.dateStr} ${s.timeStr} </span>
                  </a>
                </div>
              </div>
              ${this.renderDropdown()}
            </div>
            ${s.replyingToUsers?.length && !quoting ? this.renderReplyingTo() : ''}
            ${this.props.standalone ? this.renderHelmet() : ''}
            ${this.props.meta.torrentId
              ? html`
                  <${Torrent}
                    torrentId=${this.props.meta.torrentId}
                    autopause=${!this.props.standalone}
                  />
                `
              : ''}
            ${this.props.meta.attachments && this.renderAttachments()}
            ${s.text?.length > 0
              ? html`<div class="text ${s.emojiOnly && 'emoji-only'}">
                  ${(!this.state.showMore && this.state.shortContent) || this.state.content}
                  ${s.translatedText ? html`<p><i>${s.translatedText}</i></p>` : ''}
                </div> `
              : ''}
            ${!this.props.standalone && this.state.shortContent
              ? html`
                  <a
                    onClick=${(e) => {
                      e.preventDefault();
                      this.setState({ showMore: !s.showMore });
                    }}
                  >
                    ${t(`show_${s.showMore ? 'less' : 'more'}`)}</a
                  >
                `
              : ''}
            ${this.props.asInlineQuote ? '' : this.renderReactionBtns()}
            ${s.showLikes ? this.renderLikes() : ''} ${s.showZaps ? this.renderZaps() : ''}
            ${s.showReposts ? this.renderReposts() : ''}
            ${this.props.standalone || s.showReplyForm ? this.renderReplyForm() : ''}
          </div>
        </div>
      </div>
      ${(this.props.showReplies || s.showReplyForm) && s.sortedReplies?.length
        ? this.renderReplies()
        : ''}
    `;
  }

  openAttachmentsGallery(event) {
    $('#floating-day-separator').remove();
    const attachmentsPreview = $('<div>')
      .attr('id', 'attachment-gallery')
      .addClass('gallery')
      .addClass('attachment-preview');
    $('body').append(attachmentsPreview);
    attachmentsPreview.fadeIn(ANIMATE_DURATION);
    let left, top, width, img;

    const attachments = this.props.meta.attachments;

    attachments?.forEach((a) => {
      if (a.type.indexOf('image') === 0 && a.data) {
        img = Helpers.setImgSrc($('<img>'), a.data);
        if (attachments.length === 1) {
          attachmentsPreview.css({ 'justify-content': 'center' });
          let original = $(event.target);
          left = original.offset().left;
          top = original.offset().top - $(window).scrollTop();
          width = original.width();
          let transitionImg = img
            .clone()
            .attr('id', 'transition-img')
            .data('originalDimensions', { left, top, width });
          transitionImg.css({
            position: 'fixed',
            left,
            top,
            width,
            'max-width': 'none',
            'max-height': 'none',
          });
          img.css({ visibility: 'hidden', 'align-self': 'center' });
          attachmentsPreview.append(img);
          $('body').append(transitionImg);
          let o = img.offset();
          transitionImg.animate(
            { width: img.width(), left: o.left, top: o.top },
            {
              duration: ANIMATE_DURATION,
              complete: () => {
                img.css({ visibility: 'visible' });
                transitionImg.hide();
              },
            },
          );
        } else {
          attachmentsPreview.css({ 'justify-content': '' });
          attachmentsPreview.append(img);
        }
      }
    });
    attachmentsPreview.one('click', () => {
      this.closeAttachmentsGallery();
    });
    $(document)
      .off('keyup')
      .on('keyup', (e) => {
        if (e.key === 'Escape') {
          // escape key maps to keycode `27`
          $(document).off('keyup');
          if ($('#attachment-gallery:visible').length) {
            this.closeAttachmentsGallery();
          }
        }
      });
  }

  closeAttachmentsGallery() {
    let transitionImg = $('#transition-img');
    if (transitionImg.length) {
      let originalDimensions = transitionImg.data('originalDimensions');
      transitionImg.show();
      $('#attachment-gallery img').remove();
      transitionImg.animate(originalDimensions, {
        duration: ANIMATE_DURATION,
        complete: () => {
          transitionImg.remove();
        },
      });
    }
    $('#attachment-gallery').fadeOut({
      duration: ANIMATE_DURATION,
      complete: () => $('#attachment-gallery').remove(),
    });
    if ('activeElement' in document) {
      document.activeElement.blur();
    }
  }
}

export default Note;
