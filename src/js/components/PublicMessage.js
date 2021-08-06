import Helpers, { html } from '../Helpers.js';
import Identicon from './Identicon.js';
import PublicMessageForm from './PublicMessageForm.js';
import State from '../State.js';
import { route } from 'preact-router';
import Message from './Message.js';
import SafeImg from './SafeImg.js';
import Session from '../Session.js';
import Torrent from './Torrent.js';
import Autolinker from 'autolinker';
import iris from 'iris-lib';
import $ from 'jquery';

const autolinker = new Autolinker({ stripPrefix: false, stripTrailingSlash: false});

const heartEmpty = html`<svg width="24" viewBox="0 -28 512.001 512"><path fill="currentColor" d="m256 455.515625c-7.289062 0-14.316406-2.640625-19.792969-7.4375-20.683593-18.085937-40.625-35.082031-58.21875-50.074219l-.089843-.078125c-51.582032-43.957031-96.125-81.917969-127.117188-119.3125-34.644531-41.804687-50.78125-81.441406-50.78125-124.742187 0-42.070313 14.425781-80.882813 40.617188-109.292969 26.503906-28.746094 62.871093-44.578125 102.414062-44.578125 29.554688 0 56.621094 9.34375 80.445312 27.769531 12.023438 9.300781 22.921876 20.683594 32.523438 33.960938 9.605469-13.277344 20.5-24.660157 32.527344-33.960938 23.824218-18.425781 50.890625-27.769531 80.445312-27.769531 39.539063 0 75.910156 15.832031 102.414063 44.578125 26.191406 28.410156 40.613281 67.222656 40.613281 109.292969 0 43.300781-16.132812 82.9375-50.777344 124.738281-30.992187 37.398437-75.53125 75.355469-127.105468 119.308594-17.625 15.015625-37.597657 32.039062-58.328126 50.167969-5.472656 4.789062-12.503906 7.429687-19.789062 7.429687zm-112.96875-425.523437c-31.066406 0-59.605469 12.398437-80.367188 34.914062-21.070312 22.855469-32.675781 54.449219-32.675781 88.964844 0 36.417968 13.535157 68.988281 43.882813 105.605468 29.332031 35.394532 72.960937 72.574219 123.476562 115.625l.09375.078126c17.660156 15.050781 37.679688 32.113281 58.515625 50.332031 20.960938-18.253907 41.011719-35.34375 58.707031-50.417969 50.511719-43.050781 94.136719-80.222656 123.46875-115.617188 30.34375-36.617187 43.878907-69.1875 43.878907-105.605468 0-34.515625-11.605469-66.109375-32.675781-88.964844-20.757813-22.515625-49.300782-34.914062-80.363282-34.914062-22.757812 0-43.652344 7.234374-62.101562 21.5-16.441406 12.71875-27.894532 28.796874-34.609375 40.046874-3.453125 5.785157-9.53125 9.238282-16.261719 9.238282s-12.808594-3.453125-16.261719-9.238282c-6.710937-11.25-18.164062-27.328124-34.609375-40.046874-18.449218-14.265626-39.34375-21.5-62.097656-21.5zm0 0"/></svg>`;

const heartFull = html`<svg width="24" viewBox="0 -28 512.00002 512"><path fill="currentColor" d="m471.382812 44.578125c-26.503906-28.746094-62.871093-44.578125-102.410156-44.578125-29.554687 0-56.621094 9.34375-80.449218 27.769531-12.023438 9.300781-22.917969 20.679688-32.523438 33.960938-9.601562-13.277344-20.5-24.660157-32.527344-33.960938-23.824218-18.425781-50.890625-27.769531-80.445312-27.769531-39.539063 0-75.910156 15.832031-102.414063 44.578125-26.1875 28.410156-40.613281 67.222656-40.613281 109.292969 0 43.300781 16.136719 82.9375 50.78125 124.742187 30.992188 37.394531 75.535156 75.355469 127.117188 119.3125 17.613281 15.011719 37.578124 32.027344 58.308593 50.152344 5.476563 4.796875 12.503907 7.4375 19.792969 7.4375 7.285156 0 14.316406-2.640625 19.785156-7.429687 20.730469-18.128907 40.707032-35.152344 58.328125-50.171876 51.574219-43.949218 96.117188-81.90625 127.109375-119.304687 34.644532-41.800781 50.777344-81.4375 50.777344-124.742187 0-42.066407-14.425781-80.878907-40.617188-109.289063zm0 0"/></svg>`;

const replyIcon = html`<svg width="24" version="1.1" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;"><path fill="currentColor" d="M256,21.952c-141.163,0-256,95.424-256,212.715c0,60.267,30.805,117.269,84.885,157.717l-41.109,82.219 c-2.176,4.331-1.131,9.579,2.496,12.779c2.005,1.771,4.501,2.667,7.04,2.667c2.069,0,4.139-0.597,5.952-1.813l89.963-60.395
c33.877,12.971,69.781,19.541,106.752,19.541C397.141,447.381,512,351.957,512,234.667S397.163,21.952,256,21.952z M255.979,426.048c-36.16,0-71.168-6.741-104.043-20.032c-3.264-1.323-6.997-0.96-9.941,1.024l-61.056,40.981l27.093-54.187 c2.368-4.757,0.896-10.517-3.477-13.547c-52.907-36.629-83.243-89.707-83.243-145.6c0-105.536,105.28-191.381,234.667-191.381 s234.667,85.824,234.667,191.36S385.365,426.048,255.979,426.048z"/></svg>`;

class PublicMessage extends Message {
  constructor() {
    super();
    this.i = 0;
    this.eventListeners = {};
    this.likedBy = new Set();
    this.replies = {};
    this.subscribedReplies = new Set();
    this.state = { sortedReplies: [] };
  }

  fetchByHash() {
    const hash = this.props.hash;
    if (typeof hash !== 'string') {
      return;
    }
    return new Promise(resolve => {
      State.local.get('msgsByHash').get(hash).once(msg => {
          if (typeof msg === 'string') {
            try {
              resolve(JSON.parse(msg));
            } catch (e) {
              console.error('message parsing failed', msg, e);
            }
          }
        });
        State.public.get('#').get(hash).on(async (serialized, a, b, event) => {
          if (typeof serialized !== 'string') {
            console.error('message parsing failed', hash, serialized);
            return;
          }
          event.off();
          const msg = await iris.SignedMessage.fromString(serialized);
          if (msg) {
            resolve(msg);
            State.local.get('msgsByHash').get(hash).put(JSON.stringify(msg));
          }
        });
    });
  }

  componentDidMount() {
    const p = this.fetchByHash();
    if (!p) { return; }
    p.then(r => {
      const msg = r.signedData;
      msg.info = {from: r.signerKeyHash};
      if (this.props.filter && !this.props.filter(msg)) { return; }
      this.setState({msg});
      if (this.props.showName && !this.props.name) {
        State.public.user(msg.info.from).get('profile').get('name').on((name, a,b, e) => {
          this.eventListeners['name'] = e;
          this.setState({name});
        });
      }
      State.group().on(`likes/${encodeURIComponent(this.props.hash)}`, (liked,a,b,e,from) => {
        this.eventListeners[`${from}likes`] = e;
        liked ? this.likedBy.add(from) : this.likedBy.delete(from);
        const s = {likes: this.likedBy.size};
        if (from === Session.getPubKey()) s['liked'] = liked;
        this.setState(s);
      });
      State.group().map(`replies/${encodeURIComponent(this.props.hash)}`, (hash,time,b,e,from) => {
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
      });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.showLikes !== prevState.showLikes || this.state.showReplyForm !== prevState.showReplyForm) {
      this.measure();
    } else if (this.state.msg && this.state.msg !== prevState.msg) {
      this.measure();
    }
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

  measure() {
    this.props.measure && this.props.measure();
  }

  toggleReplies() {
    const showReplyForm = !this.state.showReplyForm;
    this.setState({showReplyForm});
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  shouldComponentUpdate() {
    return true;
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
  }

  onDelete(e) {
    e.preventDefault();
    if (confirm('Delete message?')) {
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
    if (isThumbnail && text.length > 128) {
      text = `${text.slice(0,128)  }...`;
    }
    p.innerText = text;
    const h = emojiOnly ? p.innerHTML : Helpers.highlightEmoji(p.innerHTML);
    const innerHTML = autolinker.link(h);
    const time = typeof this.state.msg.time === 'object' ? this.state.msg.time : new Date(this.state.msg.time);
    const dateStr = time.toLocaleString(window.navigator.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = time.toLocaleTimeString(window.navigator.language, {timeStyle: 'short'});


    return html`
      <div class="msg ${isThumbnail} ${this.props.asReply ? 'reply' : ''}">
        <div class="msg-content">
          <div class="msg-sender">
            <div class="msg-sender-link" onclick=${() => this.onClickName()}>
              ${this.state.msg.info.from ? html`<${Identicon} str=${this.state.msg.info.from} width=40/>` : ''}
              ${name && this.props.showName && html`<small class="msgSenderName">${name}</small>`}
            </div>
            ${this.state.msg.info.from === Session.getPubKey() ? html`
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
          ${this.state.msg.torrentId ? html`
              <${Torrent} torrentId=${this.state.msg.torrentId} autopause=${!this.props.standalone}/>
          `:''}
          ${this.state.msg.attachments && this.state.msg.attachments.map(a =>
            html`<div class="img-container">
                <div class="heart"></div>
                <${SafeImg} src=${a.data} onLoad=${() => this.measure()} onClick=${e => { this.imageClicked(e); }}/>
            </div>`
          )}
          <div class="text ${emojiOnly && 'emoji-only'}" dangerouslySetInnerHTML=${{ __html: innerHTML }} />
          ${this.state.msg.replyingTo && !this.props.asReply ? html`
            <div><a href="/post/${encodeURIComponent(this.state.msg.replyingTo)}">Show replied message</a></div>
          ` : ''}
          <div class="below-text">
            <a class="msg-btn reply-btn" onClick=${() => this.toggleReplies()}>
              ${replyIcon}
            </a>
            <span class="count" onClick=${() => this.toggleReplies()}>
              ${this.state.replyCount || ''}
            </span>
            <a class="msg-btn like-btn ${this.state.liked ? 'liked' : ''}" onClick=${e => this.likeBtnClicked(e)}>
              ${this.state.liked ? heartFull : heartEmpty}
            </a>
            <span class="count" onClick=${() => this.setState({showLikes: !this.state.showLikes})}>
              ${this.state.likes || ''}
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
          ${this.state.showLikes ? html`
            <div class="likes">
              ${Array.from(this.likedBy).map(key => {
                return html`<${Identicon} showTooltip=${true} onClick=${() => route(`/profile/${  key}`)} str=${key} width=32/>`;
              })}
            </div>
          `: ''}
          ${(this.props.showReplies || this.state.showReplyForm) && this.state.sortedReplies && this.state.sortedReplies.length ? this.state.sortedReplies.map(r =>
            html`<${PublicMessage} hash=${r.hash} asReply=${true} showName=${true} showReplies=${true} />`
          ) : ''}
          ${this.state.showReplyForm ? html`
            <${PublicMessageForm} replyingTo=${this.props.hash} />
          ` : ''}
        </div>
      </div>
      `;
  }
}

export default PublicMessage;