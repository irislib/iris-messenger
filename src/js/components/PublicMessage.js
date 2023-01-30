import { Helmet } from 'react-helmet';
import { html } from 'htm/preact';
import iris from 'iris-lib';
import $ from 'jquery';
import { route } from 'preact-router';

import Helpers from '../Helpers';
import Icons from '../Icons';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

import CopyButton from './CopyButton';
import Dropdown from './Dropdown';
import FeedMessageForm from './FeedMessageForm';
import Identicon from './Identicon';
import Message from './Message';
import Name from './Name';
import SafeImg from './SafeImg';
import Torrent from './Torrent';

const MSG_TRUNCATE_LENGTH = 500;
const MSG_TRUNCATE_LINES = 8;

const replyIcon = html`<svg width="24" viewBox="0 0 24 24" fill="currentColor">
  <path
    d="M12,1C5.4,1,0,5.5,0,11c0,2.8,1.4,5.5,4,7.4l-1.9,3.9C2,22.5,2,22.7,2.2,22.8C2.3,22.9,2.4,23,2.5,23c0.1,0,0.2,0,0.3-0.1
L7,20.1c1.6,0.6,3.3,0.9,5,0.9c6.6,0,12-4.5,12-10S18.6,1,12,1z M12,19.5c-1.6,0-3.2-0.3-4.6-0.9c-0.1-0.1-0.3,0-0.4,0l-2.7,1.8
l1.2-2.4c0.1-0.2,0-0.5-0.2-0.6c-2.3-1.6-3.7-4-3.7-6.5c0-4.7,4.7-8.5,10.4-8.5S22.4,6.4,22.4,11S17.7,19.5,12,19.5z"
  />
</svg>`;

class PublicMessage extends Message {
  constructor() {
    super();
    this.i = 0;
    this.likedBy = new Set();
    this.state = { sortedReplies: [] };
  }

  static fetchByHash(thisArg, hash) {
    if (!hash) {
      return;
    }
    const nostrId = Nostr.toNostrHexAddress(hash);
    const retrievingTimeout = setTimeout(() => {
      thisArg.setState({ retrieving: true });
    }, 1000);

    if (nostrId) {
      const processNostrMessage = (event) => {
        clearTimeout(retrievingTimeout);
        if (thisArg.state.retrieving) {
          thisArg.setState({ retrieving: false });
        }
        Nostr.getProfile(event.pubkey, (profile) => {
          if (!profile) return;
          if (!thisArg.unmounted) {
            thisArg.setState({ name: profile.name });
          }
        });
        const replyingTo = Nostr.getEventReplyingTo(event);
        return {
          signerKeyHash: event.pubkey,
          signedData: {
            text: event.content,
            time: event.created_at * 1000,
            replyingTo,
            noteId: Nostr.toNostrBech32Address(event.id, 'note'),
            event,
          },
        };
      };

      if (Nostr.eventsById.has(nostrId)) {
        // for faster painting, return synchronously if we have the message
        return processNostrMessage(Nostr.eventsById.get(nostrId));
      }

      return Nostr.getMessageById(nostrId).then((event) => {
        return processNostrMessage(event);
      });
    }
  }

  fetchByHash() {
    return PublicMessage.fetchByHash(this, this.props.hash);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.unmounted = true;
  }

  componentDidMount() {
    this.unmounted = false;

    const p = this.fetchByHash();
    if (!p) {
      return;
    }
    const myPub = iris.session.getKey().secp256k1.rpub;

    const handleMessage = (r) => {
      this.props.standalone && console.log('got message', r);
      if (this.unmounted) {
        return;
      }
      const nostrId = Nostr.toNostrHexAddress(this.props.hash);

      const msg = r.signedData;
      msg.info = {
        from: nostrId ? Nostr.toNostrBech32Address(r.signerKeyHash, 'npub') : r.signerKeyHash,
        isMine: myPub === r.signerKeyHash,
      };
      if (this.props.filter) {
        if (!this.props.filter(msg)) {
          return;
        }
      }
      if (this.props.standalone && msg.attachments && msg.attachments.length) {
        this.setOgImageUrl(msg.attachments[0].data);
      }

      // find .jpg .jpeg .gif .png .webp urls in msg.text and add them to msg.attachments
      if (msg.text) {
        let text = msg.text;
        const urls = msg.text.match(/(https?:\/\/[^\s]+)/g);
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
              if (!msg.attachments) {
                msg.attachments = [];
              }
              msg.attachments.push({ type: 'image', data: parsedUrl.origin + parsedUrl.pathname });

              // Remove URL from beginning or end of line
              text = text
                .replace(new RegExp(`^${url}`, 'g'), '')
                .replace(new RegExp(`${url}$`, 'g'), '');
            }
          });
        }
        msg.text = text.trim();
      }

      this.setState({ msg });

      if (nostrId) {
        Nostr.getRepliesAndLikes(nostrId, (replies, likedBy, threadReplyCount, boostedBy) => {
          this.likedBy = likedBy;
          this.boostedBy = boostedBy;
          const sortedReplies =
            replies &&
            Array.from(replies).sort(
              (a, b) => Nostr.eventsById.get(a)?.created_at - Nostr.eventsById.get(b)?.created_at,
            );
          this.setState({
            boosts: this.boostedBy.size,
            boosted: this.boostedBy.has(myPub),
            likes: this.likedBy.size,
            liked: this.likedBy.has(myPub),
            replyCount: threadReplyCount,
            sortedReplies,
          });
        });
      }
    };

    if (p.then) {
      p.then(handleMessage);
    } else {
      handleMessage(p);
    }
  }

  componentDidUpdate() {
    if (this.state.msg && !this.linksDone) {
      $(this.base)
        .find('a')
        .off()
        .on('click', (e) => {
          const href = $(e.target).attr('href');
          if (href && href.indexOf('https://iris.to/') === 0) {
            e.preventDefault();
            window.location = href.replace('https://iris.to/', '');
          }
        });
      this.linksDone = true;
    }
  }

  onClickName(e) {
    e.stopPropagation();
    route(`/profile/${this.state.msg.info.from}`);
  }

  likeBtnClicked(e) {
    e.preventDefault();
    this.like(!this.state.liked);
  }

  boostBtnClicked() {
    if (!this.state.boosted) {
      const author = this.state.msg?.event?.pubkey;

      const nostrId = Nostr.toNostrHexAddress(this.props.hash);
      if (nostrId) {
        Nostr.publish({
          kind: 6,
          tags: [
            ['e', nostrId, '', 'mention'],
            ['p', author],
          ],
          content: '#[0]',
        });
      }
    }
  }

  like(liked = true) {
    if (liked) {
      const author = this.state.msg?.event?.pubkey;

      const nostrId = Nostr.toNostrHexAddress(this.props.hash);
      if (nostrId) {
        Nostr.publish({
          kind: 7,
          content: '+',
          tags: [
            ['e', nostrId],
            ['p', author],
          ],
        });
      }
    }
  }

  onDelete(e) {
    e.preventDefault();
    if (confirm('Delete message?')) {
      const nostrId = Nostr.toNostrHexAddress(this.props.hash);
      if (nostrId) {
        Nostr.publish({
          kind: 5,
          content: 'deleted',
          tags: [['e', nostrId]],
        });
        this.setState({ msg: null });
      }
    }
  }

  onBroadcast(e) {
    // republish message on nostr
    e.preventDefault();
    const nostrId = Nostr.toNostrHexAddress(this.props.hash);
    if (nostrId) {
      const event = Nostr.eventsById.get(nostrId);
      if (event) {
        // TODO indicate to user somehow
        console.log('broadcasting', nostrId);
        Nostr.publish(event);
      }
    }
  }

  imageClicked(event) {
    event.preventDefault();
    if (window.innerWidth <= 625) {
      clearTimeout(this.dblTimeout);
      if (this.dbl) {
        this.dbl = false;
        this.like(); // like on double click
        $(event.target).parent().addClass('like-animate');
        setTimeout(() => $(event.target).parent().removeClass('like-animate'), 1000);
      } else {
        this.dbl = true;
        this.dblTimeout = setTimeout(() => {
          this.dbl = false;
        }, 300);
      }
    } else {
      this.openAttachmentsGallery(event);
    }
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
    if (this.state.msg?.event?.kind === 7) {
      const likedId = this.state.msg.event.tags.reverse().find((t) => t[0] === 'e')[1];
      return route(`/post/${likedId}`);
    }
    this.openStandalone();
  }

  openStandalone() {
    route(`/post/${Nostr.toNostrBech32Address(this.props.hash, 'note')}`);
  }

  replyBtnClicked() {
    if (this.props.standalone) {
      $(document).find('textarea').focus();
    } else {
      this.openStandalone();
    }
  }

  renderFollow() {
    return html`
      <div class="msg">
        <div class="msg-content">
          <div style="display: flex; align-items: center">
            <i class="boost-btn boosted" style="margin-right: 15px;"> ${Icons.newFollower} </i>
            <a href="#/profile/${Nostr.toNostrBech32Address(this.state.msg.event.pubkey, 'npub')}">
              <${Name} pub=${this.state.msg?.event?.pubkey} />
            </a>
            <span> started following you</span>
          </div>
        </div>
      </div>
    `;
  }

  renderLike() {
    const likedId = this.state.msg.event.tags.reverse().find((t) => t[0] === 'e')[1];
    let text = Nostr.eventsById.get(likedId)?.content;
    if (text && text.length > 50) {
      text = text.substr(0, 50) + '...';
    }
    return html`
      <div class="msg">
        <div class="msg-content" onClick=${(e) => this.messageClicked(e)}>
          <div
            style="display: flex; align-items: center; flex-basis: 100%; white-space: nowrap;text-overflow: ellipsis; overflow:hidden"
          >
            <i class="like-btn liked" style="margin-right: 15px;"> ${Icons.heartFull} </i>
            <a
              href="#/profile/${Nostr.toNostrBech32Address(this.state.msg.event.pubkey, 'npub')}"
              style="margin-right: 5px;"
            >
              <${Name} pub=${this.state.msg?.event?.pubkey} />
            </a>
            <span>
              liked your <a href="#/post/${likedId}">note</a> ${text && text.length
                ? html`<i>"${text}"</i>`
                : ''}</span
            >
          </div>
        </div>
      </div>
    `;
  }

  report(e) {
    e.preventDefault();
    if (confirm('Publicly report and hide message?')) {
      const nostrId = Nostr.toNostrHexAddress(this.props.hash);
      if (nostrId) {
        Nostr.publish({
          kind: 5,
          content: 'reported',
          tags: [
            ['e', nostrId],
            ['p', this.state.msg?.event?.pubkey],
          ],
        });
        this.setState({ msg: null });
      }
    }
  }

  renderDropdown() {
    const url = `https://iris.to/#/post/${Nostr.toNostrBech32Address(this.props.hash, 'note')}`;
    return html`
      <div class="msg-menu-btn">
        <${Dropdown}>
          <${CopyButton}
            key=${`${this.props.hash}copy`}
            text=${t('copy_link')}
            title="Note link"
            copyStr=${url}
          />
          <${CopyButton}
            key=${`${this.props.hash}copy`}
            text=${t('copy_ID')}
            title="Note ID"
            copyStr=${Nostr.toNostrBech32Address(this.props.hash, 'note')}
          />
          ${this.state.msg
            ? html`
                <a href="#" onClick=${(e) => this.onBroadcast(e)}>${t('resend_to_relays')}</a>
                <${CopyButton}
                  key=${`${this.props.hash}copyRaw`}
                  text=${t('copy_raw_data')}
                  title="Message raw data"
                  copyStr=${JSON.stringify(this.state.msg.event, null, 2)}
                />
                ${this.state.msg.info.isMine
                  ? html` <a href="#" onClick=${(e) => this.onDelete(e)}>${t('delete')}</a> `
                  : html`<a href="#" onClick=${(e) => this.report(e)}>${t('report (public)')}</a>`}
              `
            : ''}
        <//>
      </div>
    `;
  }

  renderBoost(id) {
    return html`
      <div class="msg">
        <div class="msg-content" style="padding: 12px 0 0 0;">
          <div style="display: flex; align-items: center; flex-basis: 100%; margin-left: 15px">
            <i style="margin-right: 15px;"> ${Icons.boost} </i>
            <a href="#/profile/${Nostr.toNostrBech32Address(this.state.msg.event.pubkey, 'npub')}">
              <${Name} pub=${this.state.msg?.event?.pubkey} />
            </a>
            <span style="margin-left: 5px"> reposted </span>
          </div>
          <${PublicMessage} hash=${id} showName=${true} />
        </div>
      </div>
    `;
  }

  toggleLikes(e) {
    console.log('toggle likes');
    e.stopPropagation();
    this.setState({ showLikes: !this.state.showLikes, showBoosts: false });
  }

  toggleBoosts(e) {
    e.stopPropagation();
    this.setState({ showBoosts: !this.state.showBoosts, showLikes: false });
  }

  render() {
    const isThumbnail = this.props.thumbnail ? 'thumbnail-item' : '';
    const s = this.state;
    const asQuote = this.props.asQuote || (this.props.showReplies && s.sortedReplies.length);
    if (!this.state.msg) {
      return html` <div
        ref=${this.ref}
        key=${this.props.hash}
        class="msg ${isThumbnail} ${this.props.asReply ? 'reply' : ''} ${this.props.standalone
          ? 'standalone'
          : ''} ${asQuote ? 'quote' : ''}"
      >
        <div class="msg-content retrieving" style="display:flex;align-items:center">
          <div class="text ${this.state.retrieving ? 'visible' : ''}">Looking up message...</div>
          <div>${this.renderDropdown()}</div>
        </div>
      </div>`;
    }

    if (Nostr.blockedUsers.has(this.state.msg.event.pubkey)) {
      if (this.props.standalone || this.props.asQuote) {
        return html`
          <div class="msg">
            <div class="msg-content">
              <p style="display: flex; align-items: center">
                <i style="margin-right: 15px;"> ${Icons.newFollower} </i>
                <span> Message from a blocked user</span>
              </p>
            </div>
          </div>
        `;
      } else {
        return '';
      }
    }

    let name = this.props.name || this.state.name || Helpers.generateName(this.state.msg.info.from);

    switch (this.state.msg?.event?.kind) {
      case 3:
        return this.renderFollow();
      case 6:
        return this.renderBoost(this.state.msg.event.tags.reverse().find((t) => t[0] === 'e')[1]);
      case 7:
        return this.renderLike();
      case 1: {
        let mentionIndex = this.state.msg?.event?.tags.findIndex(
          (tag) => tag[0] === 'e' && tag[3] === 'mention',
        );
        if (this.state.msg?.event?.content === `#[${mentionIndex}]`) {
          return this.renderBoost(this.state.msg?.event?.tags[mentionIndex][1]);
        }
        break;
      }
    }

    const emojiOnly =
      this.state.msg.text &&
      this.state.msg.text.length === 2 &&
      Helpers.isEmoji(this.state.msg.text);
    let text = this.state.msg.text;
    const shortText = text.length > 128 ? `${text.slice(0, 128)}...` : text;
    const quotedShortText = `"${shortText}"`;
    if (isThumbnail) {
      text = shortText;
    }
    const title = `${name || 'User'} on Iris`;
    text =
      text.length > MSG_TRUNCATE_LENGTH && !this.state.showMore && !this.props.standalone
        ? `${text.slice(0, MSG_TRUNCATE_LENGTH)}...`
        : text;

    const lines = text.split('\n');
    text =
      lines.length > MSG_TRUNCATE_LINES && !this.state.showMore && !this.props.standalone
        ? `${lines.slice(0, MSG_TRUNCATE_LINES).join('\n')}...`
        : text;

    text = Helpers.highlightEverything(text, this.state.msg.event);

    const time =
      typeof this.state.msg.time === 'object' ? this.state.msg.time : new Date(this.state.msg.time);
    const dateStr = time.toLocaleString(window.navigator.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = time.toLocaleTimeString(window.navigator.language, {
      timeStyle: 'short',
    });

    const ogImageUrl = s.msg.attachments?.find((a) => a.type === 'image')?.data;
    let rootMsg = s.msg.event?.tags.find((t) => t[0] === 'e' && t[3] === 'root')?.[1];
    if (!rootMsg) {
      rootMsg = s.msg.replyingTo;
    }

    const replyingToUsers = s.msg.event?.tags.filter((t) => t[0] === 'p').map((t) => t[1]);
    const quoting = s.msg.replyingTo && (this.props.showRepliedMsg || this.props.asReply);

    return html`
      ${s.msg.replyingTo && this.props.showRepliedMsg
        ? html`
            <${PublicMessage}
              key=${s.msg.replyingTo}
              hash=${s.msg.replyingTo}
              asQuote=${true}
              showName=${true}
              showReplies=${0}
            />
          `
        : ''}
      <div
        key=${this.props.hash}
        ref=${this.ref}
        class="msg ${isThumbnail} ${this.props.asReply ? 'reply' : ''} ${this.props.standalone
          ? 'standalone'
          : ''} ${asQuote ? 'quote' : ''}
          ${quoting ? 'quoting' : ''}"
      >
        <div class="msg-content" onClick=${(e) => this.messageClicked(e)}>
          ${this.props.asQuote && s.msg.replyingTo
            ? html` <div style="flex-basis:100%; margin-bottom: 12px">
                <a href="#/post/${Nostr.toNostrBech32Address(rootMsg, 'note')}">Show thread</a>
              </div>`
            : ''}
          <div class="msg-identicon">
            ${s.msg.info.from
              ? html`
                  <a href=${`#/profile/${s.msg.info.from}`}>
                    <${Identicon} str=${s.msg.info.from} width="40" />
                  </a>
                `
              : ''}
            ${asQuote && !this.props.standalone ? html`<div class="line"></div>` : ''}
          </div>
          <div class="msg-main">
            <div class="msg-sender">
              <div class="msg-sender-link" onclick=${(e) => this.onClickName(e)}>
                ${this.props.showName &&
                html`
                  <a href=${`#/profile/${s.msg.info.from}`} class="msgSenderName">
                    <${Name} pub=${s.msg.info.from} />
                  </a>
                `}
                <div class="time">
                  ${'· '}
                  <a
                    href="#/post/${encodeURIComponent(s.msg.noteId || this.props.hash)}"
                    class="tooltip"
                  >
                    ${Helpers.getRelativeTimeText(time)}
                    <span class="tooltiptext"> ${dateStr} ${timeStr} </span>
                  </a>
                </div>
              </div>
              ${this.renderDropdown()}
            </div>
            ${replyingToUsers.length && !quoting
              ? html`
                  <small class="msg-replying-to">
                    Replying to${' '}
                    ${replyingToUsers
                      .slice(0, 3)
                      .map(
                        (u) => html`
                          <a href=${`#/profile/${Nostr.toNostrBech32Address(u, 'npub')}`}>
                            @<${Name} pub=${u} hideBadge=${true} />${' '}
                          </a>
                        `,
                      )}
                    ${replyingToUsers.length > 3 ? '...' : ''}
                  </small>
                `
              : ''}
            ${this.props.standalone
              ? html`
                  <${Helmet} titleTemplate="%s">
                    <title>${title}: ${quotedShortText}</title>
                    <meta name="description" content=${quotedShortText} />
                    <meta property="og:type" content="article" />
                    ${ogImageUrl ? html`<meta property="og:image" content=${ogImageUrl} />` : ''}
                    <meta property="og:title" content=${title} />
                    <meta property="og:description" content=${quotedShortText} />
                  <//>
                `
              : ''}
            ${s.msg.torrentId
              ? html`
                  <${Torrent} torrentId=${s.msg.torrentId} autopause=${!this.props.standalone} />
                `
              : ''}
            ${s.msg.attachments &&
            s.msg.attachments.map((a, i) => {
              if (i > 0 && !this.props.standalone && !this.state.showMore) {
                return;
              }
              return html`<div class="img-container">
                <div class="heart"></div>
                <${SafeImg}
                  src=${a.data}
                  onClick=${(e) => {
                    this.imageClicked(e);
                  }}
                />
              </div>`;
            })}
            ${text.length > 0
              ? html`<div class="text ${emojiOnly && 'emoji-only'}">${text}</div> `
              : ''}
            ${!this.props.standalone &&
            ((s.msg.attachments && s.msg.attachments.length > 1) ||
              this.state.msg.text.length > MSG_TRUNCATE_LENGTH ||
              lines.length > MSG_TRUNCATE_LINES)
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
            <div class="below-text">
              <a class="msg-btn reply-btn" onClick=${() => this.replyBtnClicked()}>
                ${replyIcon}
              </a>
              <span class="count"> ${s.replyCount || ''} </span>
              <a
                class="msg-btn like-btn ${s.liked ? 'liked' : ''}"
                onClick=${(e) => this.likeBtnClicked(e)}
              >
                ${s.liked ? Icons.heartFull : Icons.heartEmpty}
              </a>
              <span
                class="count ${s.showLikes ? 'active' : ''}"
                onClick=${(e) => this.toggleLikes(e)}
              >
                ${s.likes || ''}
              </span>
              <a
                class="msg-btn boost-btn ${s.boosted ? 'boosted' : ''}"
                onClick=${() => this.boostBtnClicked()}
              >
                ${Icons.boost}
              </a>
              <span
                class="count ${s.showBoosts ? 'active' : ''}"
                onClick=${(e) => this.toggleBoosts(e)}
              >
                ${s.boosts || ''}
              </span>
            </div>
            ${s.showLikes
              ? html`
                  <div class="likes">
                    ${Array.from(this.likedBy).map((key) => {
                      return html`<${Identicon}
                        showTooltip=${true}
                        onClick=${() => route(`/profile/${key}`)}
                        str=${Nostr.toNostrBech32Address(key, 'npub')}
                        width="32"
                      />`;
                    })}
                  </div>
                `
              : ''}
            ${s.showBoosts
              ? html`
                  <div class="likes">
                    ${Array.from(this.boostedBy).map((key) => {
                      return html`<${Identicon}
                        showTooltip=${true}
                        onClick=${() => route(`/profile/${key}`)}
                        str=${Nostr.toNostrBech32Address(key, 'npub')}
                        width="32"
                      />`;
                    })}
                  </div>
                `
              : ''}
            ${this.props.standalone || s.showReplyForm
              ? html`
                  <${FeedMessageForm}
                    waitForFocus=${true}
                    autofocus=${!this.props.standalone}
                    replyingTo=${this.props.hash}
                    replyingToUser=${s.msg.info.from}
                    placeholder=${t('write_your_reply')}
                  />
                `
              : ''}
          </div>
        </div>
      </div>
      ${(this.props.showReplies || s.showReplyForm) && s.sortedReplies && s.sortedReplies.length
        ? s.sortedReplies
            .slice(0, this.props.showReplies)
            .map(
              (r) =>
                html`<${PublicMessage}
                  key=${r}
                  hash=${r}
                  asReply=${!this.props.standalone}
                  showName=${true}
                  showReplies=${1}
                  showRepliedMsg=${false}
                />`,
            )
        : ''}
    `;
  }
}

export default PublicMessage;
