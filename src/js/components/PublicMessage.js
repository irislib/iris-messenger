import Helpers from '../Helpers';
import { html } from 'htm/preact';
import Identicon from './Identicon';
import FeedMessageForm from './FeedMessageForm';
import State from 'iris-lib/src/State';
import { route } from 'preact-router';
import Message from './Message';
import SafeImg from './SafeImg';
import Session from 'iris-lib/src/Session';
import Torrent from './Torrent';
import Icons from '../Icons';
import Autolinker from 'autolinker';
import iris from 'iris-lib';
import $ from 'jquery';
import {Helmet} from "react-helmet";
import Notifications from 'iris-lib/src/Notifications';

const MSG_TRUNCATE_LENGTH = 1000;
const autolinker = new Autolinker({ stripPrefix: false, stripTrailingSlash: false});

const replyIcon = html`<svg width="24" version="1.1" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;"><path fill="currentColor" d="M256,21.952c-141.163,0-256,95.424-256,212.715c0,60.267,30.805,117.269,84.885,157.717l-41.109,82.219 c-2.176,4.331-1.131,9.579,2.496,12.779c2.005,1.771,4.501,2.667,7.04,2.667c2.069,0,4.139-0.597,5.952-1.813l89.963-60.395
c33.877,12.971,69.781,19.541,106.752,19.541C397.141,447.381,512,351.957,512,234.667S397.163,21.952,256,21.952z M255.979,426.048c-36.16,0-71.168-6.741-104.043-20.032c-3.264-1.323-6.997-0.96-9.941,1.024l-61.056,40.981l27.093-54.187 c2.368-4.757,0.896-10.517-3.477-13.547c-52.907-36.629-83.243-89.707-83.243-145.6c0-105.536,105.28-191.381,234.667-191.381 s234.667,85.824,234.667,191.36S385.365,426.048,255.979,426.048z"/></svg>`;

class PublicMessage extends Message {
  constructor() {
    super();
    this.i = 0;
    this.likedBy = new Set();
    this.replies = {};
    this.subscribedReplies = new Set();
    this.state = { sortedReplies: [] };
  }

  static fetchByHash(thisArg, hash) {
    return new Promise((resolve, reject) => {
      if (typeof hash !== 'string') {
        return reject();
      }
      State.public.get('#').get(hash).on(thisArg.sub(
        async (serialized, a, b, event) => {
          if (typeof serialized !== 'string') {
            console.error('message parsing failed', hash, serialized);
            return;
          }
          event.off();
          const msg = await iris.SignedMessage.fromString(serialized);
          if (msg) {
            resolve(msg);
          }
        }
      ));
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
    if (!p) { return; }
    p.then(r => {
      if (this.unmounted) { return; }
      const msg = r.signedData;
      msg.info = {from: r.signerKeyHash};
      if (this.props.filter) {
        if (!this.props.filter(msg)) {
          return;
        }
      }
      if (this.props.standalone && msg.attachments && msg.attachments.length) {
        this.setOgImageUrl(msg.attachments[0].data);
      }
      this.setState({msg});
      if (this.props.showName && !this.props.name) {
        State.public.user(msg.info.from).get('profile').get('name').on(this.inject());
      }
      State.group().on(`likes/${encodeURIComponent(this.props.hash)}`, this.sub(
        (liked,a,b,e,from) => {
          this.eventListeners[`${from}likes`] = e;
          liked ? this.likedBy.add(from) : this.likedBy.delete(from);
          const s = {likes: this.likedBy.size};
          if (from === Session.getPubKey()) s['liked'] = liked;
          this.setState(s);
        }
      ));
      State.group().map(`replies/${encodeURIComponent(this.props.hash)}`, this.sub(
        (hash,time,b,e,from) => {
          const k = from + time;
          if (hash && this.replies[k]) return;
          if (hash) {
            this.replies[k] = {hash, time};
          } else {
            delete this.replies[k];
          }
          this.eventListeners[`${from}replies`] = e;
          const sortedReplies = Object.values(this.replies).sort((a,b) => a.time > b.time ? 1 : -1);
          this.setState({replyCount: Object.keys(this.replies).length, sortedReplies });
        }
      ));
    });
  }

  componentDidUpdate() {
    if (this.state.msg && !this.linksDone) {
      $(this.base).find('a').off().on('click', e => {
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
    this.setState({showReplyForm});
  }

  onClickName() {
    route(`/profile/${  this.state.msg.info.from}`);
  }

  likeBtnClicked(e) {
    e.preventDefault();
    this.like(!this.state.liked);
  }

  like(liked = true) {
    State.public.user().get('likes').get(this.props.hash).put(liked);
    if (liked) {
      const author = this.state.msg && this.state.msg.info && this.state.msg.info.from;
      if (author !== Session.getPubKey()) {
        const t = (this.state.msg.text || '').trim();
        const title =  `${Session.getMyName()  } liked your post`;
        const body = `'${t.slice(0, 100)}${t.length > 100 ? '...' : ''}'`;
        Notifications.sendIrisNotification(author, {event:'like', target: this.props.hash});
        Notifications.sendWebPushNotification(author, {title, body});
      }
    }
  }

  onDelete(e) {
    e.preventDefault();
    if (confirm('Delete message?')) { // TODO: remove from hashtag indexes
      const msg = this.state.msg;
      msg.torrentId && State.public.user().get('media').get(msg.time).put(null);
      State.public.user().get(this.props.index || 'msgs').get(msg.time).put(null);
      msg.replyingTo && State.public.user().get('replies').get(msg.replyingTo).get(msg.time).put(null);
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

  render() {
    if (!this.state.msg) { return ''; }
    //if (++this.i > 1) console.log(this.i);
    let name = this.props.name || this.state.name;
    const emojiOnly = this.state.msg.text && this.state.msg.text.length === 2 && Helpers.isEmoji(this.state.msg.text);
    const isThumbnail = this.props.thumbnail ? 'thumbnail-item' : '';
    const p = document.createElement('p');
    let text = this.state.msg.text;
    const shortText = text.length > 128 ? `${text.slice(0,128)  }...` : text;
    const quotedShortText = `"${shortText}"`;
    if (isThumbnail) {
      text = shortText;
    }
    const title = `${name || 'User'} on Iris`;
    p.innerText = (text.length > MSG_TRUNCATE_LENGTH) && !this.state.showMore && !this.props.standalone ?
      `${text.slice(0, MSG_TRUNCATE_LENGTH)  }...` : text;
    let h = p.innerHTML;
    if (!emojiOnly) {
      h = Helpers.highlightEmoji(h);
      h = Helpers.highlightHashtags(h);
      h = Helpers.highlightMentions(h);
    }
    const innerHTML = autolinker.link(h);
    const time = typeof this.state.msg.time === 'object' ? this.state.msg.time : new Date(this.state.msg.time);
    const dateStr = time.toLocaleString(window.navigator.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = time.toLocaleTimeString(window.navigator.language, {timeStyle: 'short'});
    const s = this.state;

    return html`
      <div ref=${this.ref} class="msg ${isThumbnail} ${this.props.asReply ? 'reply' : ''} ${this.props.standalone ? 'standalone' : ''}">
        <div class="msg-content">
          <div class="msg-sender">
            <div class="msg-sender-link" onclick=${() => this.onClickName()}>
              ${s.msg.info.from ? html`<${Identicon} str=${s.msg.info.from} width=40/>` : ''}
              ${name && this.props.showName && html`<small class="msgSenderName">${name}</small>`}
            </div>
            ${s.msg.info.from === Session.getPubKey() ? html`
              <div class="msg-menu-btn">
                <div class="dropdown">
                  <div class="dropbtn">\u2026</div>
                  <div class="dropdown-content">
                    <a href="#" onClick=${e => this.onDelete(e)}>Delete</a>
                  </div>
                </div>
              </div>
            `: ''}
          </div>
          ${this.props.standalone ? html`
            <${Helmet} titleTemplate="%s">
                <title>${title}: ${quotedShortText}</title>
                <meta name="description" content=${quotedShortText} />
                <meta property="og:type" content="article" />
                ${s.ogImageUrl ? html`<meta property="og:image" content=${s.ogImageUrl} />` : ''}
                <meta property="og:title" content=${title} />
                <meta property="og:description" content=${quotedShortText} />
            <//>
          ` : ''}
          ${s.msg.torrentId ? html`
              <${Torrent} torrentId=${s.msg.torrentId} autopause=${!this.props.standalone}/>
          `:''}
          ${s.msg.attachments && s.msg.attachments.map((a, i) => {
            if (i > 0 && !this.props.standalone && !this.state.showMore) {
              return;
            }
            return html`<div class="img-container">
              <div class="heart"></div>
              <${SafeImg} src=${a.data} onClick=${e => { this.imageClicked(e); }}/>
            </div>`;
          })}
          <div class="text ${emojiOnly && 'emoji-only'}" dangerouslySetInnerHTML=${{ __html: innerHTML }} />
          ${!this.props.standalone && (s.msg.attachments && (s.msg.attachments.length > 1) ||
            (text.length > MSG_TRUNCATE_LENGTH)) ? html`
            <a onClick=${e => {
                e.preventDefault();
                this.setState({showMore: !s.showMore});
            }}>Show ${s.showMore ? 'less' : 'more'}</a>
          ` : ''}
          ${s.msg.replyingTo && !this.props.asReply ? html`
            <div><a href="/post/${encodeURIComponent(s.msg.replyingTo)}">Show replied message</a></div>
          ` : ''}
          <div class="below-text">
            <a class="msg-btn reply-btn" onClick=${() => this.toggleReplies()}>
              ${replyIcon}
            </a>
            <span class="count" onClick=${() => this.toggleReplies()}>
              ${s.replyCount || ''}
            </span>
            <a class="msg-btn like-btn ${s.liked ? 'liked' : ''}" onClick=${e => this.likeBtnClicked(e)}>
              ${s.liked ? Icons.heartFull : Icons.heartEmpty}
            </a>
            <span class="count" onClick=${() => this.setState({showLikes: !s.showLikes})}>
              ${s.likes || ''}
            </span>
            <div class="time">
              <a href="/post/${encodeURIComponent(this.props.hash)}" class="tooltip">
                  ${Helpers.getRelativeTimeText(time)}
                  <span class="tooltiptext">
                    ${dateStr} ${timeStr}
                  </span>
              </a>
            </div>
          </div>
          ${s.showLikes ? html`
            <div class="likes">
              ${Array.from(this.likedBy).map(key => {
                return html`<${Identicon} showTooltip=${true} onClick=${() => route(`/profile/${  key}`)} str=${key} width=32/>`;
              })}
            </div>
          `: ''}
          ${(this.props.showReplies || s.showReplyForm) && s.sortedReplies && s.sortedReplies.length ? s.sortedReplies.map(r =>
            html`<${PublicMessage} key=${r.hash} hash=${r.hash} asReply=${true} showName=${true} showReplies=${true} />`
          ) : ''}
          ${this.props.standalone || s.showReplyForm ? html`
            <${FeedMessageForm} autofocus=${!this.props.standalone} replyingTo=${this.props.hash} replyingToUser=${s.msg.info.from} />
          ` : ''}
        </div>
      </div>
      `;
  }
}

export default PublicMessage;
