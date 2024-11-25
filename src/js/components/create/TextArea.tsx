import { useCallback, useEffect, useRef, useState } from 'react';

import Show from '@/components/helpers/Show';
import SearchBox from '@/components/searchbox/SearchBox.tsx';
import Key from '@/nostr/Key';
import localState from '@/state/LocalState.ts';
import { translate as t } from '@/translations/Translation.mjs';
import Helpers from '@/utils/Helpers';
import { uploadFile } from '@/utils/uploadFile';

const mentionRegex = /\B@[\u00BF-\u1FFF\u2C00-\uD7FF\w]*$/;

interface TextAreaProps {
  submit: () => void;
  attachmentsChanged: (event) => void;
  placeholder: string;
  replyingTo?: string;
  autofocus?: boolean;
  forceAutoFocusMobile?: boolean;
  onFocus?: () => void;
  value: string;
  setValue: (value: string) => void;
}

const TextArea: React.FC<TextAreaProps> = ({
  submit,
  attachmentsChanged,
  placeholder,
  replyingTo,
  autofocus,
  forceAutoFocusMobile,
  onFocus,
  value,
  setValue,
}) => {
  const [mentioning, setMentioning] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && value) {
      el.style.height = 'auto'; // Resetting the height
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);

  useEffect(() => {
    if (!replyingTo) {
      localState
        .get('public')
        .get('draft')
        .once((text) => setValue(text));
    } else {
      const currentHistoryState = window.history.state;
      if (currentHistoryState && currentHistoryState['replyTo' + replyingTo]) {
        setValue(currentHistoryState['replyTo' + replyingTo]);
      }
    }
  }, []);

  useEffect(() => {
    if ((!Helpers.isMobile || forceAutoFocusMobile == true) && autofocus !== false) {
      ref?.current?.focus();
    }
  }, [ref.current]);

  const onPaste = useCallback((event) => {
    const clipboardData = event.clipboardData || window.clipboardData;

    if (clipboardData.items) {
      const items = clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          uploadFile(
            blob,
            (url) => setValue(value ? `${value}\n\n${url}` : url),
            (errorMsg) => console.error(errorMsg),
            Key,
          );
        }
      }
    }
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        submit();
      }
    },
    [submit],
  );

  const onInput = (event) => {
    const val = event.target.value;
    setValue(val);
    checkMention(event);
    if (!replyingTo) {
      localState.get('public').get('draft').put(val);
    }
  };

  const onKeyUp = (e) => {
    if ([37, 38, 39, 40].includes(e.keyCode)) {
      checkMention(e);
    }
  };

  const onSelectMention = (item: any) => {
    const textarea = ref.current;
    if (!textarea) return;

    const pos = textarea.selectionStart;
    const newValue = [
      textarea.value.slice(0, pos).replace(mentionRegex, 'nostr:'),
      item.key,
      textarea.value.slice(pos),
    ].join('');
    setValue(newValue);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = pos + item.key.length + 1;
  };

  const checkMention = (event) => {
    const val = event.target.value.slice(0, event.target.selectionStart);
    const matches = val.match(mentionRegex);
    if (matches) {
      const match = matches[0].slice(1);
      if (!Key.toNostrHexAddress(match)) {
        setMentioning(match);
      }
    } else {
      setMentioning(null);
    }
  };

  return (
    <>
      <textarea
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onFocus={onFocus}
        onDrop={attachmentsChanged}
        onKeyUp={onKeyUp}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onInput={onInput}
        className="p-2 mt-1 w-full h-12 bg-black focus:outline-iris-purple block w-full text-lg border-gray-700 rounded-md text-white"
        type="text"
        placeholder={t(placeholder)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck={false}
        value={value}
        ref={ref}
      />
      <Show when={mentioning}>
        <SearchBox resultsOnly query={mentioning || ''} onSelect={onSelectMention} />
      </Show>
    </>
  );
};

export default TextArea;
