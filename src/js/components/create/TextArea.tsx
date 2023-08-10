import { translate as t } from '@/translations/Translation.mjs';

interface TextAreaProps {
  onMsgTextPaste: (event: any) => void;
  onKeyUp: (e: any) => void;
  onKeyDown: (e: any) => void;
  onMsgTextInput: (event: any) => void;
  attachmentsChanged: (e: any) => void;
  placeholder: string;
  value: string;
}

const TextArea = ({
  onMsgTextPaste,
  onKeyUp,
  onKeyDown,
  onMsgTextInput,
  attachmentsChanged,
  placeholder,
  value,
}: TextAreaProps) => (
  <textarea
    onDragOver={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
    onDrop={attachmentsChanged}
    onKeyUp={onKeyUp}
    onKeyDown={onKeyDown}
    onPaste={onMsgTextPaste}
    onInput={onMsgTextInput}
    className="p-2 mt-1 w-full h-12 bg-black focus:ring-blue-500 focus:border-blue-500 block w-full text-lg border-gray-700 rounded-md text-white"
    type="text"
    placeholder={t(placeholder)}
    autoComplete="off"
    autoCorrect="off"
    autoCapitalize="sentences"
    spellCheck={false}
    value={value}
  />
);

export default TextArea;
