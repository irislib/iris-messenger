import { useRef } from 'react';
import { useCallback, useState } from 'preact/hooks';

import TextArea from '@/components/create/TextArea';
import { sendNostr } from '@/components/create/util';
import EventContent from '@/components/events/note/Content';
import Show from '@/components/helpers/Show';
import Key from '@/nostr/Key';
import localState from '@/state/LocalState.ts';
import { translate as t } from '@/translations/Translation.mjs';
import Icons from '@/utils/Icons';

type CreateNoteFormProps = {
  replyingTo?: string;
  onSubmit?: (text: string) => void;
  placeholder?: string;
  class?: string;
  autofocus?: boolean;
  forceAutoFocusMobile?: boolean;
};

function CreateNoteForm({
  replyingTo,
  onSubmit: onFormSubmit,
  placeholder = 'type_a_message',
  class: className,
  autofocus,
  forceAutoFocusMobile,
}: CreateNoteFormProps) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onMsgFormSubmit = useCallback(
    (event) => {
      event.preventDefault();
      submit();
    },
    [text],
  );

  const resetText = () => {
    if (!replyingTo) {
      localState.get('public').get('draft').put(null);
    }
    setText('');
    setFocused(false);
  };

  const submit = useCallback(async () => {
    if (!text.length) return;
    const msg: any = { text };
    if (replyingTo) msg.replyingTo = replyingTo;

    await sendNostr(msg);
    onFormSubmit?.(msg);

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    resetText();
  }, [text, replyingTo, onFormSubmit]);

  const attachFileClicked = useCallback((event) => {
    event.stopPropagation();
    event.preventDefault();

    // Use the ref to simulate a click on the file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileAttachments = useCallback((files) => {
    if (!files) return;

    const uploadApiUrl = 'https://nostr.build/api/v2/upload/files';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const authEvent = {
        kind: 27235,
        created_at: Math.floor(Date.now() / 1000),
        content: '',
        tags: [
          ['u', uploadApiUrl],
          ['method', 'POST'],
        ],
        pubkey: Key.getPubKey(),
        sig: '',
        id: '',
      };

      Key.sign(authEvent)
        .then((signature) => {
          authEvent.sig = signature;
          const authHeader = `Nostr ${btoa(JSON.stringify(authEvent))}`;

          const formData = new FormData();
          formData.append('file', file);

          return fetch(uploadApiUrl, {
            method: 'POST',
            body: formData,
            headers: {
              Authorization: authHeader,
            },
          });
        })
        .then(async (response) => {
          const uploadResult = await response.json();
          if (response.status === 200 && uploadResult?.status === 'success') {
            const url = uploadResult.data[0].url;
            setText((prevText) => (prevText ? `${prevText}\n\n${url}` : url));
          } else {
            console.error('Upload failed', uploadResult);
          }
        })
        .catch((error) => {
          console.error('upload error', error);
        });
    }
  }, []);

  const attachmentsChanged = useCallback(
    (event) => {
      event.preventDefault();
      const files = event.target.files || event.dataTransfer.files;
      handleFileAttachments(files);
    },
    [handleFileAttachments],
  );

  const onClickCancel = useCallback(
    (e) => {
      e.preventDefault();
      if (!text || text.split(' ').length < 10 || confirm(t('discard_changes'))) {
        resetText();
      }
    },
    [text],
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
        submit={submit}
        setValue={setText}
        value={text}
        attachmentsChanged={attachmentsChanged}
        placeholder={placeholder}
        autofocus={autofocus}
        forceAutoFocusMobile={forceAutoFocusMobile}
        replyingTo={replyingTo}
      />
      <Show when={focused}>
        <div className="flex items-center justify-between mt-4">
          <button type="button" className="btn btn-sm" onClick={attachFileClicked}>
            {Icons.attach}
          </button>
          <div className="flex flex-row gap-2">
            <button className="btn btn-sm btn-neutral" onClick={onClickCancel}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-sm btn-primary" disabled={!text?.length}>
              {t('post')}
            </button>
          </div>
        </div>
        <div className="p-2 md:p-4 bg-neutral-900 rounded-sm my-4">
          <div className="text-xs text-neutral-500 mb-2">{t('preview')}</div>
          <EventContent
            fullWidth={true}
            isPreview={true}
            event={{
              content: text,
              pubkey: Key.getPubKey(),
              created_at: Math.floor(Date.now() / 1000),
            }}
          />
        </div>
      </Show>
    </form>
  );
}

export default CreateNoteForm;
