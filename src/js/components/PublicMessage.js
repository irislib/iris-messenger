import { Helmet } from 'react-helmet';
import { html } from 'htm/preact';
import iris from 'iris-lib';
import $ from 'jquery';
import { route } from 'preact-router';

import Helpers from '../Helpers';
import Icons from '../Icons';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

import FeedMessageForm from './FeedMessageForm';
import Identicon from './Identicon';
import Message from './Message';
import SafeImg from './SafeImg';
import Torrent from './Torrent';

const MSG_TRUNCATE_LENGTH = 1000;

const replyIcon = html`<svg
  width="24"
  version="1.1"
  x="0px"
  y="0px"
  viewBox="0 0 512 512"
  style="enable-background:new 0 0 512 512;"
>
  <path
    fill="currentColor"
    d="M256,21.952c-141.163,0-256,95.424-256,212.715c0,60.267,30.805,117.269,84.885,157.717l-41.109,82.219 c-2.176,4.331-1.131,9.579,2.496,12.779c2.005,1.771,4.501,2.667,7.04,2.667c2.069,0,4.139-0.597,5.952-1.813l89.963-60.395
c33.877,12.971,69.781,19.541,106.752,19.541C397.141,447.381,512,351.957,512,234.667S397.163,21.952,256,21.952z M255.979,426.048c-36.16,0-71.168-6.741-104.043-20.032c-3.264-1.323-6.997-0.96-9.941,1.024l-61.056,40.981l27.093-54.187 c2.368-4.757,0.896-10.517-3.477-13.547c-52.907-36.629-83.243-89.707-83.243-145.6c0-105.536,105.28-191.381,234.667-191.381 s234.667,85.824,234.667,191.36S385.365,426.048,255.979,426.048z"
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

      if (Nostr.messagesById.has(nostrId)) {
        // for faster painting, return synchronously if we have the message
        return processNostrMessage(Nostr.messagesById.get(nostrId));
      }

      return Nostr.getMessageById(nostrId).then((event) => {
        return processNostrMessage(event);
      });
    }

    return new Promise((resolve, reject) => {
      if (typeof hash !== 'string') {
        return reject();
      }
      iris.static.get(hash).then(async (serialized) => {
        if (typeof serialized !== 'string') {
          console.error('message parsing failed', hash, serialized);
          return;
        }
        const msg = await iris.SignedMessage.fromString(serialized);
        if (msg) {
          resolve(msg);
        }
      });
    });
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
            if (parsedUrl.pathname.match(/\.(jpg|jpeg|gif|png|webp)$/)) {
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
        msg.text = text;
      }

      this.setState({ msg });

      if (nostrId) {
        Nostr.getRepliesAndLikes(nostrId, (replies, likes, threadReplyCount) => {
          this.likedBy = new Set(likes);
          const sortedReplies =
            replies &&
            Array.from(replies).sort(
              (a, b) => Nostr.messagesById.get(a)?.time - Nostr.messagesById.get(b)?.time,
            );
          this.setState({
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

  toggleReplies() {
    const showReplyForm = !this.state.showReplyForm;
    this.setState({ showReplyForm });
  }

  onClickName() {
    route(`/profile/${this.state.msg.info.from}`);
  }

  likeBtnClicked(e) {
    e.preventDefault();
    this.like(!this.state.liked);
  }

  like(liked = true) {
    iris.public().get('likes').get(this.props.hash).put(liked);
    if (liked) {
      const author = this.state.msg && this.state.msg.info && this.state.msg.info.from;

      const nostrId = Nostr.toNostrHexAddress(this.props.hash);
      console.log('nostrId', nostrId);
      if (nostrId) {
        Nostr.publish({
          kind: 7,
          content: '+',
          tags: [
            ['e', nostrId],
            ['p', author],
          ],
        });
        console.log({
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
      const event = Nostr.messagesById.get(nostrId);
      if (event) {
        console.log('broadcasting');
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

  shortPubKey(pubKey) {
    return pubKey.slice(0, 4) + '...' + pubKey.slice(-4);
  }

  render() {
    const isThumbnail = this.props.thumbnail ? 'thumbnail-item' : '';
    if (!this.state.msg) {
      return html` <div
        ref=${this.ref}
        key=${this.props.hash}
        class="msg ${isThumbnail} ${this.props.asReply ? 'reply' : ''} ${this.props.standalone
          ? 'standalone'
          : ''}"
      >
        <div class="msg-content">
          ${this.state.retrieving ? html`<div class="retrieving">Looking up message...</div>` : ''}
        </div>
      </div>`;
    }
    //if (++this.i > 1) console.log(this.i);
    let name = this.props.name || this.state.name || this.shortPubKey(this.state.msg.info.from);
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

    text = Helpers.highlightEverything(text, this.state.msg.event);
    //console.log('text', text);

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
    const s = this.state;

    return html`
      <div
        key=${this.props.hash}
        ref=${this.ref}
        class="msg ${isThumbnail} ${this.props.asReply ? 'reply' : ''} ${this.props.standalone
          ? 'standalone'
          : ''} ${this.props.asQuote ? 'quote' : ''}"
      >
        <div class="msg-content">
          ${s.msg.replyingTo && !this.props.asReply && !this.props.asQuote
            ? html`
                <div style="padding: 0 15px 0 15px">
                  <${PublicMessage}
                    key=${s.msg.replyingTo}
                    hash=${s.msg.replyingTo}
                    asQuote=${true}
                    showName=${true}
                    showReplies=${false}
                  />
                </div>
              `
            : ''}

          <div class="msg-sender">
            <div class="msg-sender-link" onclick=${() => this.onClickName()}>
              ${s.msg.info.from ? html`<${Identicon} str=${s.msg.info.from} width="40" />` : ''}
              ${name && this.props.showName && html`<small class="msgSenderName">${name}</small>`}
            </div>
            ${s.msg.info.isMine
              ? html`
                  <div class="msg-menu-btn">
                    <div class="dropdown">
                      <div class="dropbtn">…</div>
                      <div class="dropdown-content">
                        <!-- <a href="#" onClick=${(e) => this.onDelete(e)}>Delete</a> -->
                        <a href="#" onClick=${(e) => this.onBroadcast(e)}>Re-broadcast</a>
                      </div>
                    </div>
                  </div>
                `
              : ''}
          </div>
          ${this.props.standalone
            ? html`
                <${Helmet} titleTemplate="%s">
                  <title>${title}: ${quotedShortText}</title>
                  <meta name="description" content=${quotedShortText} />
                  <meta property="og:type" content="article" />
                  ${s.ogImageUrl ? html`<meta property="og:image" content=${s.ogImageUrl} />` : ''}
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
          <div class="text ${emojiOnly && 'emoji-only'}">${text}</div>
          ${!this.props.standalone &&
          ((s.msg.attachments && s.msg.attachments.length > 1) ||
            this.state.msg.text.length > MSG_TRUNCATE_LENGTH)
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
            ${this.props.asQuote
              ? ''
              : html`
                  <a class="msg-btn reply-btn" onClick=${() => this.toggleReplies()}>
                    ${replyIcon}
                  </a>
                  <span class="count" onClick=${() => this.toggleReplies()}>
                    ${s.replyCount || ''}
                  </span>
                  <a
                    class="msg-btn like-btn ${s.liked ? 'liked' : ''}"
                    onClick=${(e) => this.likeBtnClicked(e)}
                  >
                    ${s.liked ? Icons.heartFull : Icons.heartEmpty}
                  </a>
                  <span class="count" onClick=${() => this.setState({ showLikes: !s.showLikes })}>
                    ${s.likes || ''}
                  </span>
                `}
            <div class="time">
              <a
                href="/post/${encodeURIComponent(s.msg.noteId || this.props.hash)}"
                class="tooltip"
              >
                ${Helpers.getRelativeTimeText(time)}
                <span class="tooltiptext"> ${dateStr} ${timeStr} </span>
              </a>
            </div>
          </div>
          ${s.showLikes
            ? html`
                <div class="likes">
                  ${Array.from(this.likedBy).map((key) => {
                    return html`<${Identicon}
                      showTooltip=${true}
                      onClick=${() => route(`/profile/${key}`)}
                      str=${key}
                      width="32"
                    />`;
                  })}
                </div>
              `
            : ''}
          ${(this.props.showReplies || s.showReplyForm) && s.sortedReplies && s.sortedReplies.length
            ? s.sortedReplies.map(
                (r) =>
                  html`<${PublicMessage}
                    key=${r}
                    hash=${r}
                    asReply=${true}
                    showName=${true}
                    showReplies=${true}
                  />`,
              )
            : ''}
          ${this.props.standalone || s.showReplyForm
            ? html`
                <${FeedMessageForm}
                  autofocus=${!this.props.standalone}
                  replyingTo=${this.props.hash}
                  replyingToUser=${s.msg.info.from}
                />
              `
            : ''}
        </div>
      </div>
    `;
  }
}

export default PublicMessage;
