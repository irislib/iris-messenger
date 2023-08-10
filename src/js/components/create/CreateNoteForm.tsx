import $ from 'jquery';

import Component from '@/BaseComponent';
import FileAttachment from '@/components/create/FileAttachment.tsx';
import TextArea from '@/components/create/TextArea';
import { IProps, IState } from '@/components/create/types';
import { sendNostr } from '@/components/create/util.ts';
import Show from '@/components/helpers/Show.tsx';
import SearchBox from '@/components/SearchBox';
import Helpers from '@/Helpers';
import Icons from '@/Icons';
import localState from '@/LocalState';
import Key from '@/nostr/Key';
import { translate as t } from '@/translations/Translation.mjs';
import { uploadFile } from '@/utils/uploadFile';

import AttachmentPreview from './AttachmentPreview';

const mentionRegex = /\B@[\u00BF-\u1FFF\u2C00-\uD7FF\w]*$/;

class CreateNoteForm extends Component<IProps, IState> {
  componentDidMount() {
    const textEl = $(this.base).find('textarea');
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
        .once((text) => this.setState({ text }));
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
    const text = this.state.text;
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
    await sendNostr(msg);
    this.props.onSubmit && this.props.onSubmit(msg);
    this.setState({ attachments: undefined, torrentId: undefined, text: '' });
    $(this.base).find('textarea').height('');
    this.saveDraftToHistory();
  }

  setTextareaHeight(textarea) {
    textarea.style.height = '';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  onMsgTextPaste(event) {
    const clipboardData = event.clipboardData || window.clipboardData;

    // Handling magnet links
    const pasted = clipboardData.getData('text');
    const magnetRegex = /(magnet:\?xt=urn:btih:.*)/gi;
    const match = magnetRegex.exec(pasted);
    console.log('magnet match', match);
    if (match) {
      this.setState({ torrentId: match[0] });
    }

    if (clipboardData.items) {
      const items = clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          uploadFile(
            blob,
            (url) => {
              const currentVal = this.state.text;
              if (currentVal) {
                this.setState({ text: currentVal + '\n\n' + url });
              } else {
                this.setState({ text: url });
              }
            },
            (errorMsg) => {
              console.error(errorMsg);
            },
          );
        }
      }
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
    const text = this.state.text;
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
    this.setState({ text: $(event.target).val() });
  }

  attachFileClicked(event) {
    event.stopPropagation();
    event.preventDefault();
    $(this.base).find('.attachment-input').click();
  }

  handleFileAttachments(files) {
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
              const currentVal = this.state.text;
              if (currentVal) {
                this.setState({ text: currentVal + '\n\n' + url });
              } else {
                this.setState({ text: url });
              }
            }
          })
          .catch((error) => {
            console.error('upload error', error);
            a[i].error = 'upload failed';
            this.setState({ attachments: a });
          });
      }
      $(this.base).find('textarea').focus();
    }
  }

  attachmentsChanged(event) {
    // TODO use Upload btn
    event.preventDefault();
    const files = event.target.files || event.dataTransfer.files;
    this.handleFileAttachments(files);
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

    return (
      <form
        autoComplete="off"
        className={`message-form ${this.props.class || ''} public`}
        onSubmit={(e) => this.onMsgFormSubmit(e)}
      >
        <FileAttachment onFilesChanged={(files) => this.handleFileAttachments(files)} />
        <TextArea
          onMsgTextPaste={(e) => this.onMsgTextPaste(e)}
          onKeyUp={(e) => this.onKeyUp(e)}
          onKeyDown={(e) => this.onKeyDown(e)}
          onMsgTextInput={(e) => this.onMsgTextInput(e)}
          attachmentsChanged={(e) => this.attachmentsChanged(e)}
          placeholder={textareaPlaceholder}
          value={this.state.text}
        />
        <Show when={this.state.mentioning}>
          <SearchBox
            resultsOnly
            query={this.state.mentioning}
            onSelect={(item) => this.onSelectMention(item)}
          />
        </Show>
        <Show when={!(this.props.waitForFocus && !this.state.focused)}>
          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              className="attach-file-btn btn"
              onClick={(e) => this.attachFileClicked(e)}
            >
              {Icons.attach}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('post')}
            </button>
          </div>
        </Show>
        <AttachmentPreview
          attachments={this.state.attachments}
          torrentId={this.state.torrentId}
          removeAttachments={() => this.setState({ attachments: undefined })}
        />
      </form>
    );
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

export default CreateNoteForm;
