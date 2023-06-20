import { html } from 'htm/preact';
import $ from 'jquery';
import { Event } from 'nostr-tools';
import { createRef } from 'preact';

import Component from '../BaseComponent';
import Helpers from '../Helpers';
import Icons from '../Icons';
import localState from '../LocalState';
import Events from '../nostr/Events';
import Key from '../nostr/Key';
import { translate as t } from '../translations/Translation.mjs';

import SafeImg from './SafeImg';
import SearchBox from './SearchBox';
import Torrent from './Torrent';

const mentionRegex = /\B@[\u00BF-\u1FFF\u2C00-\uD7FF\w]*$/;

interface IProps {
  replyingTo?: string;
  forceAutofocusMobile?: boolean;
  autofocus?: boolean;
  onSubmit?: (msg: any) => void;
  waitForFocus?: boolean;
  class?: string;
  index?: string;
  placeholder?: string;
}

interface IState {
  attachments?: any[];
  torrentId?: string;
  mentioning?: boolean;
  focused?: boolean;
}

class PublicMessageForm extends Component<IProps, IState> {
  newMsgRef = createRef();

  componentDidMount() {
    const textEl = $(this.newMsgRef.current);
    if (
      (!Helpers.isMobile || this.props.forceAutofocusMobile == true) &&
      this.props.autofocus !== false
    ) {
      textEl.focus();
    }
    if (!this.props.replyingTo) {
      localState
        .get('channels')
        .get('public')
        .get('msgDraft')
        .once((t) => !textEl.val() && textEl.val(t));
    } else {
      const currentHistoryState = window.history.state;
      if (currentHistoryState && currentHistoryState['replyTo' + this.props.replyingTo]) {
        textEl.val(currentHistoryState['replyTo' + this.props.replyingTo]);
      }
    }
  }

  onMsgFormSubmit(event) {
    event.preventDefault();
    this.submit();
  }

  async submit() {
    if (!this.props.replyingTo) {
      localState.get('channels').get('public').get('msgDraft').put(null);
    }
    const textEl = $(this.newMsgRef.current);
    const text = textEl.val();
    if (!text.length) {
      return;
    }
    const msg: any = { text };
    if (this.props.replyingTo) {
      msg.replyingTo = this.props.replyingTo;
    }
    if (this.state.attachments) {
      msg.attachments = this.state.attachments;
    }
    await this.sendNostr(msg);
    this.props.onSubmit && this.props.onSubmit(msg);
    this.setState({ attachments: undefined, torrentId: undefined });
    textEl.val('');
    textEl.height('');
    this.saveDraftToHistory();
  }

  setTextareaHeight(textarea) {
    textarea.style.height = '';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  onMsgTextPaste(event) {
    const pasted = (event.clipboardData || window.clipboardData).getData('text');
    const magnetRegex = /(magnet:\?xt=urn:btih:.*)/gi;
    const match = magnetRegex.exec(pasted);
    console.log('magnet match', match);
    if (match) {
      this.setState({ torrentId: match[0] });
    }
  }

  onKeyUp(e) {
    if ([37, 38, 39, 40].indexOf(e.keyCode) != -1) {
      this.checkMention(e);
    }
  }

  onKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      this.submit();
    }
  }

  saveDraftToHistory() {
    const text = $(this.newMsgRef.current).val();
    const currentHistoryState = window.history.state;
    const newHistoryState = {
      ...currentHistoryState,
    };
    newHistoryState['replyTo' + this.props.replyingTo] = text;
    window.history.replaceState(newHistoryState, '');
  }

  onMsgTextInput(event) {
    this.setTextareaHeight(event.target);
    if (!this.props.replyingTo) {
      localState.get('channels').get('public').get('msgDraft').put($(event.target).val());
    }
    this.checkMention(event);
    this.saveDraftToHistory();
  }

  attachFileClicked(event) {
    event.stopPropagation();
    event.preventDefault();
    $(this.base).find('.attachment-input').click();
  }

  attachmentsChanged(event) {
    const files = event.target.files || event.dataTransfer.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('fileToUpload', files[i]);

        const a = this.state.attachments || [];
        a[i] = a[i] || {
          type: files[i].type,
        };

        Helpers.getBase64(files[i]).then((base64) => {
          a[i].data = base64;
          this.setState({ attachments: a });
        });

        fetch('https://nostr.build/api/upload/iris.php', {
          method: 'POST',
          body: formData,
        })
          .then(async (response) => {
            const url = await response.json();
            console.log('upload response', url);
            if (url) {
              a[i].url = url;
              this.setState({ attachments: a });
              const textEl = $(this.newMsgRef.current);
              const currentVal = textEl.val();
              if (currentVal) {
                textEl.val(currentVal + '\n\n' + url);
              } else {
                textEl.val(url);
              }
            }
          })
          .catch((error) => {
            console.error('upload error', error);
            a[i].error = 'upload failed';
            this.setState({ attachments: a });
          });
      }
      $(event.target).val(null);
      $(this.newMsgRef.current).focus();
    }
  }

  onSelectMention(item) {
    const textarea = $(this.base).find('textarea').get(0);
    const pos = textarea.selectionStart;
    const join = [
      textarea.value.slice(0, pos).replace(mentionRegex, 'nostr:'),
      item.key,
      textarea.value.slice(pos),
    ].join('');
    textarea.value = `${join} `;
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = pos + item.key.length;
  }

  render() {
    const textareaPlaceholder =
      this.props.placeholder ||
      (this.props.index === 'media' ? 'type_a_message_or_paste_a_magnet_link' : 'type_a_message');
    return html`<form
      autocomplete="off"
      class="message-form ${this.props.class || ''} public"
      onSubmit=${(e) => this.onMsgFormSubmit(e)}
    >
      <input
        name="attachment-input"
        type="file"
        class="hidden attachment-input"
        accept="image/*, video/*, audio/*"
        multiple
        onChange=${(e) => this.attachmentsChanged(e)}
      />
      <textarea
        onDragOver=${(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop=${(e) => {
          e.preventDefault();
          e.stopPropagation();
          this.attachmentsChanged(e);
        }}
        onKeyUp=${(e) => this.onKeyUp(e)}
        onKeyDown=${(e) => this.onKeyDown(e)}
        onPaste=${(e) => this.onMsgTextPaste(e)}
        onInput=${(e) => this.onMsgTextInput(e)}
        onFocus=${() => this.setState({ focused: true })}
        ref=${this.newMsgRef}
        className="p-2 mt-1 w-full h-12 bg-black focus:ring-blue-500 focus:border-blue-500 block w-full text-lg border-gray-700 rounded-md text-white"
        type="text"
        placeholder="${t(textareaPlaceholder)}"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="sentences"
        spellcheck="off"
      />
      ${this.state.mentioning
        ? html`
            <${SearchBox}
              resultsOnly=${true}
              query=${this.state.mentioning}
              onSelect=${(item) => this.onSelectMention(item)}
            />
          `
        : ''}
      ${this.props.waitForFocus && !this.state.focused
        ? ''
        : html`
            <div className="flex items-center justify-between mt-4">
              <button
                type="button"
                class="attach-file-btn btn"
                onClick=${(e) => this.attachFileClicked(e)}
              >
                ${Icons.attach}
              </button>
              <button type="submit" className="btn btn-primary">${t('post')}</button>
            </div>
          `}

      <div class="attachment-preview">
        ${this.state.torrentId
          ? html` <${Torrent} preview=${true} torrentId=${this.state.torrentId} /> `
          : ''}
        ${this.state.attachments && this.state.attachments.length
          ? html`
              <p>
                <a
                  href=""
                  onClick=${(e) => {
                    e.preventDefault();
                    this.setState({ attachments: undefined });
                  }}
                  >${t('remove_attachment')}</a
                >
              </p>
            `
          : ''}
        ${this.state.attachments &&
        this.state.attachments.map((a) => {
          const status = html` ${a.error
            ? html`<span class="error">${a.error}</span>`
            : a.url || 'uploading...'}`;

          // if a.url matches audio regex
          if (a.type?.startsWith('audio')) {
            return html`
              ${status}
              <audio controls>
                <source src=${a.data} />
              </audio>
            `;
          }
          // if a.url matches video regex
          if (a.type?.startsWith('video')) {
            return html`
              ${status}
              <video controls loop=${true} autoplay=${true} muted=${true}>
                <source src=${a.data} />
              </video>
            `;
          }

          // image regex
          if (a.type?.startsWith('image')) {
            return html`${status} <${SafeImg} src=${a.data} /> `;
          }

          return 'unknown attachment type';
        })}
      </div>
    </form>`;
  }

  async sendNostr(msg: { text: string; replyingTo?: string }) {
    const event = {
      kind: 1,
      content: msg.text,
    } as any;

    if (msg.replyingTo) {
      const id = Key.toNostrHexAddress(msg.replyingTo);
      if (!id) {
        throw new Error('invalid replyingTo');
      }
      const replyingTo: Event = await new Promise((resolve) => {
        Events.getEventById(id, true, (e) => resolve(e));
      });
      event.tags = replyingTo.tags.filter((tag) => tag[0] === 'p');
      let rootTag = replyingTo.tags?.find((t) => t[0] === 'e' && t[3] === 'root');
      if (!rootTag) {
        rootTag = replyingTo.tags?.find((t) => t[0] === 'e');
      }
      if (rootTag) {
        event.tags.unshift(['e', id, '', 'reply']);
        event.tags.unshift(['e', rootTag[1], '', 'root']);
      } else {
        event.tags.unshift(['e', id, '', 'root']);
      }
      if (!event.tags?.find((t) => t[0] === 'p' && t[1] === replyingTo.pubkey)) {
        event.tags.push(['p', replyingTo.pubkey]);
      }
    }

    function handleTagged(regex, tagType) {
      const taggedItems = [...msg.text.matchAll(regex)]
        .map((m) => m[0])
        .filter((m, i, a) => a.indexOf(m) === i);

      if (taggedItems) {
        event.tags = event.tags || [];
        for (const tag of taggedItems) {
          const match = tag.match(/npub[a-zA-Z0-9]{59,60}/)?.[0];
          const hexTag = match && Key.toNostrHexAddress(match);
          if (!hexTag) {
            continue;
          }
          const newTag = [tagType, hexTag, '', 'mention'];
          // add if not already present
          if (!event.tags?.find((t) => t[0] === newTag[0] && t[1] === newTag[1])) {
            event.tags.push(newTag);
          }
        }
      }
    }

    handleTagged(Helpers.pubKeyRegex, 'p');
    handleTagged(Helpers.noteRegex, 'e');

    const hashtags = [...msg.text.matchAll(Helpers.hashtagRegex)].map((m) => m[0].slice(1));
    if (hashtags.length) {
      event.tags = event.tags || [];
      for (const hashtag of hashtags) {
        if (!event.tags?.find((t) => t[0] === 't' && t[1] === hashtag)) {
          event.tags.push(['t', hashtag]);
        }
      }
    }

    console.log('sending event', event);
    return Events.publish(event);
  }

  checkMention(event: any) {
    const val = event.target.value.slice(0, event.target.selectionStart);
    const matches = val.match(mentionRegex);
    if (matches) {
      const match = matches[0].slice(1);
      if (!Key.toNostrHexAddress(match)) {
        this.setState({ mentioning: match });
      }
    } else if (this.state.mentioning) {
      this.setState({ mentioning: undefined });
    }
  }
}

export default PublicMessageForm;
