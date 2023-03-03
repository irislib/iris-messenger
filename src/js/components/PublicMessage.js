import { Helmet } from 'react-helmet';
import { html } from 'htm/preact';
import $ from 'jquery';
import { escapeRegExp } from 'lodash';
import { route } from 'preact-router';

import AnimalName from '../AnimalName';
import Helpers from '../Helpers';
import Icons from '../Icons';
import localState from '../LocalState';
import Events from '../nostr/Events';
import Key from '../nostr/Key';
import SocialNetwork from '../nostr/SocialNetwork';
import { translate as t } from '../translations/Translation';

import BlockButton from './BlockButton';
import CopyButton from './CopyButton';
import Dropdown from './Dropdown';
import FeedMessageForm from './FeedMessageForm';
import FollowButton from './FollowButton';
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

const lightningIcon = html`<svg width="24" height="20" viewBox="0 0 16 20" fill="none">
  <path
    d="M8.8333 1.70166L1.41118 10.6082C1.12051 10.957 0.975169 11.1314 0.972948 11.2787C0.971017 11.4068 1.02808 11.5286 1.12768 11.6091C1.24226 11.7017 1.46928 11.7017 1.92333 11.7017H7.99997L7.16663 18.3683L14.5888 9.46178C14.8794 9.11297 15.0248 8.93857 15.027 8.79128C15.0289 8.66323 14.9719 8.54141 14.8723 8.46092C14.7577 8.36833 14.5307 8.36833 14.0766 8.36833H7.99997L8.8333 1.70166Z"
    stroke="currentColor"
    stroke-width="1.66667"
    stroke-linecap="round"
    stroke-linejoin="round"
  ></path>
</svg>`;

class PublicMessage extends Message {
  constructor() {
    super();
    this.i = 0;
    this.likedBy = new Set();
    this.state = { sortedReplies: [] };
    this.subscriptions = [];
  }

  static fetchByHash(thisArg, hash) {
    if (!hash) {
      return;
    }
    const nostrId = Key.toNostrHexAddress(hash);
    const retrievingTimeout = setTimeout(() => {
      thisArg.setState({ retrieving: true });
    }, 1000);

    if (nostrId) {
      const processNostrMessage = (event) => {
        clearTimeout(retrievingTimeout);
        if (thisArg.state.retrieving) {
          thisArg.setState({ retrieving: false });
        }
        const unsub = SocialNetwork.getProfile(event.pubkey, (profile) => {
          if (!profile) return;
          if (!thisArg.unmounted) {
            let lightning = profile.lud16 || profile.lud06;
            if (lightning && !lightning.startsWith('lightning:')) {
              lightning = `lightning:${lightning}`;
            }
            thisArg.setState({
              name: profile.display_name || profile.name,
              lightning,
            });
          }
        });
        thisArg.subscriptions.push(unsub);
        const replyingTo = Events.getEventReplyingTo(event);
        return {
          signerKeyHash: event.pubkey,
          signedData: {
            text: event.content,
            time: event.created_at * 1000,
            replyingTo,
            noteId: Key.toNostrBech32Address(event.id, 'note'),
            event,
          },
        };
      };

      if (Events.cache.has(nostrId)) {
        // for faster painting, return synchronously if we have the message
        return processNostrMessage(Events.cache.get(nostrId));
      } else {
        return Events.getEventById(nostrId, true).then((event) => {
          return processNostrMessage(event);
        });
      }
    }
  }

  fetchByHash() {
    return PublicMessage.fetchByHash(this, this.props.hash);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.subscriptions.forEach((unsub) => {
      unsub();
    });
    this.unmounted = true;
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.standalone) {
      if (!prevState.msg && this.state.msg) {
        setTimeout(() => {
          // important for SEO: prerenderReady is false until page content is loaded
          window.prerenderReady = true;
        }, 1000); // give other things a sec to load
      }
    }
  }

  componentDidMount() {
    this.unmounted = false;
    const hexId = Key.toNostrHexAddress(this.props.hash);
    this.hexId = hexId;
    localState.get('mutedNotes').on(
      this.sub((mutedNotes) => {
        const muted = mutedNotes && mutedNotes[hexId];
        this.setState({ muted });
      }),
    );

    const p = this.fetchByHash();
    if (!p) {
      return;
    }
    const myPub = Key.getPubKey();

    const handleMessage = (r) => {
      if (this.unmounted) {
        return;
      }

      const msg = r.signedData;
      msg.info = {
        from: hexId ? Key.toNostrBech32Address(r.signerKeyHash, 'npub') : r.signerKeyHash,
        isMine: myPub === r.signerKeyHash,
      };
      if (this.props.filter) {
        if (!this.props.filter(msg)) {
          return;
        }
      }
      if (this.props.standalone && msg.attachments && msg.attachments.length) {
        this.setState({ ogImageUrl: msg.attachments[0].data });
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
              msg.attachments.push({ type: 'image', data: `${parsedUrl.href}` });

              // Remove URL from beginning or end of line or before newline
              const esc = escapeRegExp(url);
              text = text.replace(new RegExp(`^${esc}`), '');
              text = text.replace(new RegExp(`${esc}$`), '');
              text = text.replace(new RegExp(`${esc}\n`), ' ');
            }
          });
        }
        msg.text = text.trim();
      }

      this.setState({ msg });

      if (hexId) {
        const unsub = Events.getRepliesAndReactions(
          hexId,
          (replies, likedBy, threadReplyCount, repostedBy, zaps) => {
            // zaps.size &&
            //  console.log('zaps.size', zaps.size, Key.toNostrBech32Address(hexId, 'note'));
            this.likedBy = likedBy;
            this.repostedBy = repostedBy;
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
                if (eventA?.pubkey === msg.event?.pubkey && eventB?.pubkey !== msg.event?.pubkey) {
                  return -1;
                } else if (
                  eventA?.pubkey !== msg.event?.pubkey &&
                  eventB?.pubkey === msg.event?.pubkey
                ) {
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
          },
        );
        this.subscriptions.push(unsub);
      }
    };

    if (p.then) {
      p.then(handleMessage);
    } else {
      handleMessage(p);
    }
  }

  onClickName(e) {
    e.preventDefault();
    e.stopPropagation();
    route(`/${this.state.msg.info.from}`);
  }

  likeBtnClicked(e) {
    e.preventDefault();
    this.like(!this.state.liked);
  }

  repostBtnClicked() {
    if (!this.state.reposted) {
      const author = this.state.msg?.event?.pubkey;
      const hexId = Key.toNostrHexAddress(this.props.hash);
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
      const author = this.state.msg?.event?.pubkey;

      const hexId = Key.toNostrHexAddress(this.props.hash);
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
      const hexId = Key.toNostrHexAddress(this.props.hash);
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
    const hexId = Key.toNostrHexAddress(this.props.hash);
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
    if (this.state.msg?.event?.kind === 7) {
      const likedId = this.state.msg.event.tags?.reverse().find((t) => t[0] === 'e')[1];
      return route(`/post/${likedId}`);
    }
    this.openStandalone();
  }

  openStandalone() {
    route(`/post/${Key.toNostrBech32Address(this.props.hash, 'note')}`);
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
            <i class="repost-btn reposted" style="margin-right: 15px;"> ${Icons.newFollower} </i>
            <a href="/${Key.toNostrBech32Address(this.state.msg.event.pubkey, 'npub')}">
              <${Name} pub=${this.state.msg?.event?.pubkey} />
            </a>
            <span class="mar-left5"> started following you</span>
          </div>
        </div>
      </div>
    `;
  }

  onMute(e) {
    e.preventDefault();
    localState.get('mutedNotes').get(this.hexId).put(!this.state.muted);
  }

  renderLike() {
    const likedId = this.state.msg.event.tags?.reverse().find((t) => t[0] === 'e')[1];
    const likedEvent = Events.cache.get(likedId);
    let text = likedEvent?.content;
    if (text && text.length > 50) {
      text = Helpers.highlightText(text, likedEvent);
    } else {
      text = Helpers.highlightText(text, likedEvent);
    }
    const link = `/post/${Key.toNostrBech32Address(likedId, 'note')}`;
    const userLink = `/${Key.toNostrBech32Address(this.state.msg.event.pubkey, 'npub')}`;
    return html`
      <div class="msg">
        <div class="msg-content" onClick=${(e) => this.messageClicked(e)}>
          <div
            style="display: flex; align-items: center; flex-basis: 100%; white-space: nowrap;text-overflow: ellipsis; overflow:hidden"
          >
            <i class="like-btn liked" style="margin-right: 15px;"> ${Icons.heartFull} </i>
            <a href=${userLink} style="margin-right: 5px;">
              <${Name} pub=${this.state.msg?.event?.pubkey} userNameOnly=${true} />
            </a>
            <span>
              liked your <a href=${link}>note</a> ${text && text.length
                ? html`<i>"${text}"</i>`
                : ''}</span
            >
          </div>
        </div>
      </div>
    `;
  }

  renderZap() {
    const likedId = this.state.msg.event.tags?.reverse().find((t) => t[0] === 'e')?.[1];
    const likedEvent = Events.cache.get(likedId);
    let text = likedEvent?.content;
    if (text && text.length > 50) {
      text = Helpers.highlightText(text, likedEvent);
    } else {
      text = Helpers.highlightText(text, likedEvent);
    }
    const zappingUser = Events.getZappingUser(this.state.msg.event.id);
    const link = `/post/${Key.toNostrBech32Address(likedId, 'note')}`;
    const userLink = `/${zappingUser}`;
    return html`
      <div class="msg">
        <div class="msg-content" onClick=${(e) => this.messageClicked(e)}>
          <div
            style="display: flex; align-items: center; flex-basis: 100%; white-space: nowrap;text-overflow: ellipsis; overflow:hidden"
          >
            <i class="zap-btn zapped" style="margin-right: 15px;"> ${lightningIcon} </i>
            <a href=${userLink} style="margin-right: 5px;">
              <${Name} pub=${zappingUser} userNameOnly=${true} />
            </a>
            <span>
              zapped your <a href=${link}>note</a> ${text && text.length
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
      const hexId = Key.toNostrHexAddress(this.props.hash);
      if (hexId) {
        Events.publish({
          kind: 5,
          content: 'reported',
          tags: [
            ['e', hexId],
            ['p', this.state.msg?.event?.pubkey],
          ],
        });
        this.setState({ msg: null });
      }
    }
  }

  translate(e) {
    e.preventDefault();
    Helpers.translateText(this.state.msg?.event?.content).then((res) => {
      this.setState({ translatedText: res.translatedText });
    });
  }

  renderDropdown() {
    if (this.props.asInlineQuote) {
      return '';
    }
    const url = `https://iris.to/post/${Key.toNostrBech32Address(this.props.hash, 'note')}`;
    return html`
      <div class="msg-menu-btn">
        <${Dropdown}>
          <${CopyButton}
            key=${`${this.props.hash}copy_link`}
            text=${t('copy_link')}
            title="Note link"
            copyStr=${url}
          />
          <${CopyButton}
            key=${`${this.props.hash}copy_id`}
            text=${t('copy_note_ID')}
            title="Note ID"
            copyStr=${Key.toNostrBech32Address(this.props.hash, 'note')}
          />
          <a href="#" onClick=${(e) => this.onMute(e)}>
            ${this.state.muted ? t('unmute') : t('mute')}
          </a>
          ${this.state.msg
            ? html`
                <a href="#" onClick=${(e) => this.onBroadcast(e)}>${t('resend_to_relays')}</a>
                <a href="#" onClick=${(e) => this.translate(e)}>${t('translate')}</a>
                <${CopyButton}
                  key=${`${this.props.hash}copyRaw`}
                  text=${t('copy_raw_data')}
                  title="Message raw data"
                  copyStr=${JSON.stringify(this.state.msg.event, null, 2)}
                />
                ${this.state.msg.info.isMine
                  ? html` <a href="#" onClick=${(e) => this.onDelete(e)}>${t('delete')}</a> `
                  : html`<a href="#" onClick=${(e) => this.report(e)}>${t('report_public')}</a>
                      <${FollowButton} id=${this.state.msg.event?.pubkey} showName=${true} />
                      <span onClick=${() => this.setState({ msg: null })}>
                        <${BlockButton} id=${this.state.msg.event?.pubkey} showName=${true} />
                      </span> `}
              `
            : ''}
        <//>
      </div>
    `;
  }

  renderRepost(id) {
    return html`
      <div class="msg">
        <div class="msg-content" style="padding: 12px 0 0 0;">
          <div style="display: flex; align-items: center; flex-basis: 100%; margin-left: 15px">
            <small class="reposted">
              <i> ${Icons.repost} </i>
              <a href="/${Key.toNostrBech32Address(this.state.msg.event.pubkey, 'npub')}">
                <${Name}
                  pub=${this.state.msg?.event?.pubkey}
                  hideBadge=${true}
                  userNameOnly=${true}
                />
              </a>
              <span style="margin-left: 5px"> ${t('reposted')} </span>
            </small>
          </div>
          <${PublicMessage} hash=${id} showName=${true} />
        </div>
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
          <div class="text ${this.state.retrieving ? 'visible' : ''}">
            ${t('looking_up_message')}
          </div>
          <div>${this.renderDropdown()}</div>
        </div>
      </div>`;
    }

    if (SocialNetwork.blockedUsers.has(this.state.msg.event.pubkey)) {
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

    let name = this.props.name || this.state.name || AnimalName(this.state.msg.info.from);

    switch (this.state.msg?.event?.kind) {
      case 3:
        return this.renderFollow();
      case 6:
        return this.renderRepost(this.state.msg.event.tags?.reverse().find((t) => t[0] === 'e')[1]);
      case 7:
        return this.renderLike();
      case 9735:
        return this.renderZap();
      case 1: {
        let mentionIndex = this.state.msg?.event?.tags?.findIndex(
          (tag) => tag[0] === 'e' && tag[3] === 'mention',
        );
        if (this.state.msg?.event?.content === `#[${mentionIndex}]`) {
          return this.renderRepost(this.state.msg?.event?.tags[mentionIndex][1]);
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

    text = Helpers.highlightEverything(text, this.state.msg.event, {
      showMentionedMessages: !this.props.asInlineQuote,
    });

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

    let replyingToUsers = [];
    const hasETags = s.msg.event.tags?.some((t) => t[0] === 'e');
    if (hasETags) {
      replyingToUsers = s.msg.event?.tags.filter((t) => t[0] === 'p').map((t) => t[1]);
    }
    // remove duplicates
    replyingToUsers = [...new Set(replyingToUsers)];
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
          ${quoting ? 'quoting' : ''}
        ${this.props.asInlineQuote ? 'inline-quote' : ''}"
      >
        <div class="msg-content" onClick=${(e) => this.messageClicked(e)}>
          ${this.props.asQuote && s.msg.replyingTo
            ? html` <div style="flex-basis:100%; margin-bottom: 12px">
                <a href="/post/${Key.toNostrBech32Address(rootMsg, 'note')}">${t('show_thread')}</a>
              </div>`
            : ''}
          <div class="msg-identicon">
            ${s.msg.info.from
              ? html`
                  <a href=${`/${s.msg.info.from}`}>
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
                  <a href=${`/${s.msg.info.from}`} class="msgSenderName">
                    <${Name} pub=${s.msg.info.from} />
                  </a>
                `}
                <div class="time">
                  ${'· '}
                  <a
                    href="/post/${encodeURIComponent(s.msg.noteId || this.props.hash)}"
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
                    ${t('replying_to') + ' '}
                    ${replyingToUsers
                      .slice(0, 3)
                      .map(
                        (u) => html`
                          <a href=${`/${Key.toNostrBech32Address(u, 'npub')}`}>
                            @<${Name} pub=${u} hideBadge=${true} userNameOnly=${true} />${' '}
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
                <${SafeImg}
                  width=${569}
                  src=${a.data}
                  onClick=${(e) => {
                    this.imageClicked(e);
                  }}
                />
              </div>`;
            })}
            ${text.length > 0
              ? html`<div class="text ${emojiOnly && 'emoji-only'}">
                  ${text} ${s.translatedText ? html`<p><i>${s.translatedText}</i></p>` : ''}
                </div> `
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
            ${this.props.asInlineQuote
              ? ''
              : html`
                  <div class="below-text">
                    <a class="msg-btn reply-btn" onClick=${() => this.replyBtnClicked()}>
                      ${replyIcon}
                    </a>
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
                    <span
                      class="count ${s.showLikes ? 'active' : ''}"
                      onClick=${(e) => this.toggleLikes(e)}
                    >
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
                `}
            ${s.showLikes
              ? html`
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
                `
              : ''}
            ${s.showZaps
              ? html`
                  <div class="likes">
                    ${(s.zappers || []).map((npub) => {
                      return html`<${Identicon}
                        showTooltip=${true}
                        onClick=${() => route(`/${npub}`)}
                        str=${npub}
                        width="32"
                      />`;
                    })}
                  </div>
                `
              : ''}
            ${s.showReposts
              ? html`
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
