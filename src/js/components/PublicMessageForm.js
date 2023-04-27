import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { html } from 'htm/preact';
import $ from 'jquery';
import { createRef } from 'preact';

import Helpers from '../Helpers';
import Icons from '../Icons';
import EmojiButton from '../lib/emoji-button';
import localState from '../LocalState';
import { translate as t } from '../translations/Translation';

import MessageForm from './MessageForm';
import SafeImg from './SafeImg';
import SearchBox from './SearchBox';
import Torrent from './Torrent';

const mentionRegex = /\B@[\u00BF-\u1FFF\u2C00-\uD7FF\w]*$/;

class PublicMessageForm extends MessageForm {
  newMsgRef = createRef();

  componentDidMount() {
    const textEl = $(this.newMsgRef.current);
    this.picker = new EmojiButton({ position: 'top-start' });
    this.picker.on('emoji', (emoji) => {
      textEl.val(textEl.val() + emoji);
      textEl.focus();
    });
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
    const msg = { text };
    if (this.props.replyingTo) {
      msg.replyingTo = this.props.replyingTo;
    }
    if (this.state.attachments) {
      msg.attachments = this.state.attachments;
    }
    await this.sendNostr(msg);
    this.props.onSubmit && this.props.onSubmit(msg);
    this.setState({ attachments: null, torrentId: null });
    textEl.val('');
    textEl.height('');
    this.saveDraftToHistory();
  }

  onEmojiButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this.picker.pickerVisible ? this.picker.hidePicker() : this.picker.showPicker(event.target);
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
    let files = event.target.files || event.dataTransfer.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        let formData = new FormData();
        formData.append('fileToUpload', files[i]);

        const a = this.state.attachments || [];
        a[i] = a[i] || {
          type: files[i].type,
        };

        Helpers.getBase64(files[i]).then((base64) => {
          a[i].data = base64;
          this.setState({ attachments: a });
        });

        fetch('https://nostr.build/upload.php', {
          method: 'POST',
          body: formData,
        })
          .then(async (response) => {
            const text = await response.text();
            const url = text.match(
              /https:\/\/nostr\.build\/(?:i|av)\/nostr\.build_[a-z0-9]{64}\.[a-z0-9]+/i,
            );
            if (url) {
              a[i].url = url[0];
              this.setState({ attachments: a });
              const textEl = $(this.newMsgRef.current);
              const currentVal = textEl.val();
              if (currentVal) {
                textEl.val(currentVal + '\n\n' + url[0]);
              } else {
                textEl.val(url[0]);
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
      textarea.value.slice(0, pos).replace(mentionRegex, '@'),
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
        class="new-msg"
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
            <div>
              <button
                type="button"
                class="attach-file-btn"
                onClick=${(e) => this.attachFileClicked(e)}
              >
                ${Icons.attach}
              </button>
              <button
                class="emoji-picker-btn hidden-xs"
                type="button"
                onClick=${(e) => this.onEmojiButtonClick(e)}
              >
                ${Icons.smile}
              </button>
              <button type="submit">
                <span>${t('post')} </span>
                <${PaperAirplaneIcon} width="24" style="margin-top:5px" />
              </button>
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
                    this.setState({ attachments: null });
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
}

export default PublicMessageForm;
