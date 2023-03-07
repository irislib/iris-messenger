import { html } from 'htm/preact';

import Component from '../../BaseComponent';
import Icons from '../../Icons';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation';
import Block from '../buttons/Block';
import Copy from '../buttons/Copy';
import FollowButton from '../buttons/Follow';
import Dropdown from '../Dropdown';

import Follow from './Follow';
import Like from './Like';
import Note from './Note';
import NoteImage from './NoteImage';
import Repost from './Repost';
import Zap from './Zap';

class EventComponent extends Component {
  constructor() {
    super();
    this.i = 0;
    this.likedBy = new Set();
    this.state = { sortedReplies: [] };
    this.subscriptions = [];
  }

  handleEvent(event) {
    clearTimeout(this.retrievingTimeout);
    if (this.unmounted) {
      return;
    }

    if (this.state.retrieving) {
      this.setState({ retrieving: false });
    }
    const unsub = SocialNetwork.getProfile(event.pubkey, (profile) => {
      if (!profile) return;
      let lightning = profile.lud16 || profile.lud06;
      if (lightning && !lightning.startsWith('lightning:')) {
        lightning = `lightning:${lightning}`;
      }
      const meta = this.state.meta || {};
      meta.name = profile.display_name || profile.name;
      meta.lightning = lightning;
      this.setState({ meta });
    });
    this.subscriptions.push(unsub);
    const replyingTo = Events.getNoteReplyingTo(event);

    const meta = {
      npub: Key.toNostrBech32Address(event.pubkey, 'npub'),
      noteId: Key.toNostrBech32Address(event.id, 'note'),
      time: event.created_at * 1000,
      isMine: Key.getPubKey() === event.pubkey,
      attachments: [],
      replyingTo,
    };

    this.event = event;
    this.setState({ event, meta });
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
    if (!this.props.id) {
      console.log('error: no id', this.props);
      return;
    }
    this.unmounted = false;
    this.setState({ meta: { id: this.props.id } });
    const hexId = Key.toNostrHexAddress(this.props.id);
    this.hexId = hexId;
    localState.get('mutedNotes').on(
      this.sub((mutedNotes) => {
        const muted = mutedNotes && mutedNotes[hexId];
        this.setState({ muted });
      }),
    );

    this.retrievingTimeout = setTimeout(() => {
      this.setState({ retrieving: true });
    }, 1000);
    Events.getEventById(hexId, true, (event) => this.handleEvent(event));
  }

  onDelete(e) {
    e.preventDefault();
    if (confirm('Delete message?')) {
      const hexId = Key.toNostrHexAddress(this.props.id);
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
    const hexId = Key.toNostrHexAddress(this.props.id);
    if (hexId) {
      const event = Events.cache.get(hexId);
      if (event) {
        // TODO indicate to user somehow
        console.log('broadcasting', hexId);
        Events.publish(event);
      }
    }
  }

  renderDropdown() {
    if (this.props.asInlineQuote) {
      return '';
    }
    const url = `https://iris.to/${Key.toNostrBech32Address(this.props.id, 'note')}`;
    return html`
      <div class="msg-menu-btn">
        <${Dropdown}>
          <${Copy}
            key=${`${this.props.id}copy_link`}
            text=${t('copy_link')}
            title="Note link"
            copyStr=${url}
          />
          <${Copy}
            key=${`${this.props.id}copy_id`}
            text=${t('copy_note_ID')}
            title="Note ID"
            copyStr=${Key.toNostrBech32Address(this.props.id, 'note')}
          />
          <a href="#" onClick=${(e) => this.onMute(e)}>
            ${this.state.muted ? t('unmute') : t('mute')}
          </a>
          ${this.state.event
            ? html`
                <a href="#" onClick=${(e) => this.onBroadcast(e)}>${t('resend_to_relays')}</a>
                <a href="#" onClick=${(e) => this.translate(e)}>${t('translate')}</a>
                <${Copy}
                  key=${`${this.props.id}copyRaw`}
                  text=${t('copy_raw_data')}
                  title="Message raw data"
                  copyStr=${JSON.stringify(this.state.event, null, 2)}
                />
                ${this.state.isMine
                  ? html` <a href="#" onClick=${(e) => this.onDelete(e)}>${t('delete')}</a> `
                  : html`<a href="#" onClick=${(e) => this.report(e)}>${t('report_public')}</a>
                      <${FollowButton} id=${this.state.event?.pubkey} showName=${true} />
                      <span onClick=${() => this.setState({ msg: null })}>
                        <${Block} id=${this.state.event?.pubkey} showName=${true} />
                      </span> `}
              `
            : ''}
        <//>
      </div>
    `;
  }

  render() {
    if (!this.props.id) {
      console.error('no id on event', this.props);
      return;
    }
    const isThumbnail = this.props.thumbnail ? 'thumbnail-item' : '';
    const s = this.state;
    const asQuote = this.props.asQuote || (this.props.showReplies && s.sortedReplies.length);
    if (!this.state.event) {
      return html` <div
        ref=${this.ref}
        key=${this.props.id}
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

    if (SocialNetwork.blockedUsers.has(this.state.event.pubkey)) {
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

    let Component = Note; // TODO unknown event kinds should be displayed as raw data
    if (this.state.event.kind === 1) {
      let mentionIndex = this.state.event?.tags?.findIndex(
        (tag) => tag[0] === 'e' && tag[3] === 'mention',
      );
      if (this.state.event?.content === `#[${mentionIndex}]`) {
        // do we want this for kind 1 reposts?
        Component = Repost;
      }
    } else {
      Component = {
        1: Note,
        3: Follow,
        6: Repost,
        7: Like,
        9735: Zap,
      }[this.state.event.kind];
    }
    if (this.props.renderAs === 'NoteImage') {
      Component = NoteImage;
    }
    if (!Component) {
      console.error('unknown event kind', this.state.event);
      return '';
    }

    return html`<${Component}
      key=${this.props.id}
      event=${this.state.event}
      meta=${this.state.meta}
      ...${this.props}
    />`;
  }
}

export default EventComponent;
