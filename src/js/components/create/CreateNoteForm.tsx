import { useRef } from 'react';
import { useCallback, useState } from 'preact/hooks';

import TextArea from '@/components/create/TextArea';
import { sendNostr } from '@/components/create/util';
import Show from '@/components/helpers/Show';
import Helpers from '@/Helpers';
import Icons from '@/Icons';
import localState from '@/LocalState';
import { translate as t } from '@/translations/Translation.mjs';

import AttachmentPreview from './AttachmentPreview';

type CreateNoteFormProps = {
  replyingTo?: string;
  onSubmit?: (text: string) => void;
  placeholder?: string;
  class?: string;
  waitForFocus?: boolean;
  autofocus?: boolean;
  forceAutoFocusMobile?: boolean;
};

function CreateNoteForm({
  replyingTo,
  onSubmit: onFormSubmit,
  placeholder = 'type_a_message',
  class: className,
  waitForFocus,
  autofocus,
  forceAutoFocusMobile,
}: CreateNoteFormProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [torrentId, setTorrentId] = useState('');
  const [focused, setFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onMsgFormSubmit = useCallback(
    (event) => {
      event.preventDefault();
      submit();
    },
    [text, attachments, torrentId],
  );

  const submit = useCallback(async () => {
    if (!replyingTo) {
      localState.get('public').get('draft').put(null);
    }
    if (!text.length) return;
    const msg: any = { text };
    if (replyingTo) msg.replyingTo = replyingTo;
    if (attachments.length) msg.attachments = attachments;

    await sendNostr(msg);
    onFormSubmit?.(msg);

    setText('');
    setAttachments([]);
    setTorrentId('');
  }, [text, attachments, torrentId, replyingTo, onFormSubmit]);

  const attachFileClicked = useCallback((event) => {
    event.stopPropagation();
    event.preventDefault();

    // Use the ref to simulate a click on the file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileAttachments = useCallback(
    (files) => {
      if (!files) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Initialize or use existing attachments array
        const currentAttachments = [...attachments];
        currentAttachments[i] = currentAttachments[i] || { type: file.type };

        // Get the base64 representation of the file
        Helpers.getBase64(file).then((base64) => {
          currentAttachments[i].data = base64;
          setAttachments(currentAttachments);
        });

        const formData = new FormData();
        formData.append('fileToUpload', file);

        fetch('https://nostr.build/api/upload/iris.php', {
          method: 'POST',
          body: formData,
        })
          .then(async (response) => {
            const url = await response.json();
            if (url) {
              currentAttachments[i].url = url;
              setAttachments(currentAttachments);

              setText((prevText) => (prevText ? `${prevText}\n\n${url}` : url));
            }
          })
          .catch((error) => {
            console.error('upload error', error);
            currentAttachments[i].error = 'upload failed';
            setAttachments(currentAttachments);
          });
      }
    },
    [attachments, text],
  );

  const attachmentsChanged = useCallback(
    (event) => {
      event.preventDefault();
      const files = event.target.files || event.dataTransfer.files;
      handleFileAttachments(files);
    },
    [handleFileAttachments],
  );

  return (
    <form autoComplete="off" className={className || ''} onSubmit={(e) => onMsgFormSubmit(e)}>
      <input
        type="file"
        className="hidden"
        accept="image/*, video/*, audio/*"
        multiple
        onChange={attachmentsChanged}
        ref={fileInputRef}
      />
      <TextArea
        onFocus={() => setFocused(true)}
        setTorrentId={setTorrentId}
        submit={submit}
        setValue={setText}
        value={text}
        attachmentsChanged={attachmentsChanged}
        placeholder={placeholder}
        autofocus={autofocus}
        forceAutoFocusMobile={forceAutoFocusMobile}
      />
      <Show when={!waitForFocus || focused}>
        <div className="flex items-center justify-between mt-4">
          <button type="button" className="btn" onClick={attachFileClicked}>
            {Icons.attach}
          </button>
          <button type="submit" className="btn btn-primary">
            {t('post')}
          </button>
        </div>
      </Show>
      <AttachmentPreview
        attachments={attachments}
        torrentId={torrentId}
        removeAttachments={() => setAttachments([])}
      />
    </form>
  );
}

export default CreateNoteForm;
