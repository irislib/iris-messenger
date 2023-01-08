import { html } from 'htm/preact';
import iris from 'iris-lib';
import $ from 'jquery';
import { createRef } from 'preact';

import Helpers from '../Helpers';
import EmojiButton from '../lib/emoji-button';
import { translate as t } from '../translations/Translation';

import MessageForm from './MessageForm';
import SafeImg from './SafeImg';
import SearchBox from './SearchBox';
import Torrent from './Torrent';

const mentionRegex = /\B@[\u00BF-\u1FFF\u2C00-\uD7FF\w]*$/;

class FeedMessageForm extends MessageForm {
  newMsgRef = createRef();

  componentDidMount() {
    const textEl = $(this.newMsgRef.current);
    this.picker = new EmojiButton({ position: 'top-start' });
    this.picker.on('emoji', (emoji) => {
      textEl.val(textEl.val() + emoji);
      textEl.focus();
    });
    if (
      (!iris.util.isMobile || this.props.forceAutofocusMobile == true) &&
      this.props.autofocus !== false
    ) {
      textEl.focus();
    }
    if (!this.props.replyingTo) {
      iris
        .local()
        .get('channels')
        .get('public')
        .get('msgDraft')
        .once((t) => !textEl.val() && textEl.val(t));
    }
  }

  async onMsgFormSubmit(event) {
    event.preventDefault();
    if (!this.props.replyingTo) {
      iris.local().get('channels').get('public').get('msgDraft').put(null);
    }
    const textEl = $(this.newMsgRef.current);
    const text = textEl.val();
    if (!text.length && !this.state.attachments && !this.state.torrentId) {
      return;
    }
    if (this.props.index === 'media' && !this.state.torrentId) {
      return;
    }
    const msg = { text };
    if (this.props.replyingTo) {
      msg.replyingTo = this.props.replyingTo;
    }
    if (this.state.attachments) {
      msg.attachments = this.state.attachments;
    }
    if (this.state.torrentId) {
      msg.torrentId = this.state.torrentId;
    }
    await this.sendNostr(msg);
    this.setState({ attachments: null, torrentId: null });
    textEl.val('');
    textEl.height('');
    this.props.onSubmit && this.props.onSubmit(msg);
  }

  onEmojiButtonClick(event) {
    event.preventDefault();
    this.picker.pickerVisible ? this.picker.hidePicker() : this.picker.showPicker(event.target);
  }

  setTextareaHeight(textarea) {
    textarea.style.height = '';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  onMsgTextPaste(event) {
    const pasted = (event.clipboardData || window.clipboardData).getData('text');
    const magnetRegex = /^magnet:\?xt=urn:btih:*/;
    if (
      (pasted !== this.state.torrentId && pasted.indexOf('.torrent') > -1) ||
      pasted.match(magnetRegex)
    ) {
      event.preventDefault();
      this.setState({ torrentId: pasted });
    }
  }

  onKeyUp(e) {
    if ([37, 38, 39, 40].indexOf(e.keyCode) != -1) {
      this.checkMention(e);
    }
  }

  onMsgTextInput(event) {
    this.setTextareaHeight(event.target);
    if (!this.props.replyingTo) {
      iris.local().get('channels').get('public').get('msgDraft').put($(event.target).val());
    }
    this.checkMention(event);
  }

  attachFileClicked(event) {
    event.preventDefault();
    $(this.base).find('.attachment-input').click();
  }

  attachmentsChanged(event) {
    let files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        Helpers.getBase64(files[i]).then((base64) => {
          const a = this.state.attachments || [];
          a.push({ type: 'image', data: base64 });
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
      this.props.index === 'media' ? 'type_a_message_or_paste_a_magnet_link' : 'type_a_message';
    return html`<form
      autocomplete="off"
      class="message-form ${this.props.class || ''} public"
      onSubmit=${(e) => this.onMsgFormSubmit(e)}
    >
      <input
        name="attachment-input"
        type="file"
        class="hidden attachment-input"
        accept="image/*"
        multiple
        onChange=${(e) => this.attachmentsChanged(e)}
      />
      ${this.props.index === 'media'
        ? html`
            <p>
              <small
                dangerouslySetInnerHTML=${{
                  __html: t('download_webtorrent', 'href="https://webtorrent.io/desktop/"'),
                }}
              />
            </p>
          `
        : ''}
      <textarea
        onKeyUp=${(e) => this.onKeyUp(e)}
        onPaste=${(e) => this.onMsgTextPaste(e)}
        onInput=${(e) => this.onMsgTextInput(e)}
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
      <div>
        <!--
        <button type="button" class="attach-file-btn" onClick=${(e) => this.attachFileClicked(e)}>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M21.586 10.461l-10.05 10.075c-1.95 1.949-5.122 1.949-7.071 0s-1.95-5.122 0-7.072l10.628-10.585c1.17-1.17 3.073-1.17 4.243 0 1.169 1.17 1.17 3.072 0 4.242l-8.507 8.464c-.39.39-1.024.39-1.414 0s-.39-1.024 0-1.414l7.093-7.05-1.415-1.414-7.093 7.049c-1.172 1.172-1.171 3.073 0 4.244s3.071 1.171 4.242 0l8.507-8.464c.977-.977 1.464-2.256 1.464-3.536 0-2.769-2.246-4.999-5-4.999-1.28 0-2.559.488-3.536 1.465l-10.627 10.583c-1.366 1.368-2.05 3.159-2.05 4.951 0 3.863 3.13 7 7 7 1.792 0 3.583-.684 4.95-2.05l10.05-10.075-1.414-1.414z"
            />
          </svg>
        </button> -->
        <button
          class="emoji-picker-btn hidden-xs"
          type="button"
          onClick=${(e) => this.onEmojiButtonClick(e)}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            data-prefix="far"
            data-icon="smile"
            class="svg-inline--fa fa-smile fa-w-16"
            role="img"
            viewBox="0 0 496 512"
          >
            <path
              fill="currentColor"
              d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-110.3 0-200-89.7-200-200S137.7 56 248 56s200 89.7 200 200-89.7 200-200 200zm-80-216c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm4 72.6c-20.8 25-51.5 39.4-84 39.4s-63.2-14.3-84-39.4c-8.5-10.2-23.7-11.5-33.8-3.1-10.2 8.5-11.5 23.6-3.1 33.8 30 36 74.1 56.6 120.9 56.6s90.9-20.6 120.9-56.6c8.5-10.2 7.1-25.3-3.1-33.8-10.1-8.4-25.3-7.1-33.8 3.1z"
            ></path>
          </svg>
        </button>
        <button type="submit">
          <svg
            class="svg-inline--fa fa-w-16"
            x="0px"
            y="0px"
            viewBox="0 0 486.736 486.736"
            style="enable-background:new 0 0 486.736 486.736;"
            width="100px"
            height="100px"
            fill="currentColor"
            stroke="#000000"
            stroke-width="0"
          >
            <path
              fill="currentColor"
              d="M481.883,61.238l-474.3,171.4c-8.8,3.2-10.3,15-2.6,20.2l70.9,48.4l321.8-169.7l-272.4,203.4v82.4c0,5.6,6.3,9,11,5.9 l60-39.8l59.1,40.3c5.4,3.7,12.8,2.1,16.3-3.5l214.5-353.7C487.983,63.638,485.083,60.038,481.883,61.238z"
            ></path>
          </svg>
        </button>
      </div>
      <div class="attachment-preview">
        ${this.state.torrentId
          ? html`
              <p>
                <a
                  href=""
                  onClick=${(e) => {
                    e.preventDefault();
                    this.setState({ torrentId: null });
                  }}
                  >${t('remove_attachment')}</a
                >
              </p>
              <${Torrent} preview=${true} torrentId=${this.state.torrentId} />
            `
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
        this.state.attachments.map((a) => html` <${SafeImg} src=${a.data} /> `)}
      </div>
    </form>`;
  }
}

export default FeedMessageForm;
