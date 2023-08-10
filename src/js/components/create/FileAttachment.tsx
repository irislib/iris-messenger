import $ from 'jquery';
import { FunctionalComponent } from 'preact';

type Props = {
  onFilesChanged: (files: File[]) => void;
};

const FileAttachment: FunctionalComponent<Props> = ({ onFilesChanged }) => {
  const attachmentsChanged = (event) => {
    const files = event.target.files || event.dataTransfer.files;
    if (files) {
      onFilesChanged(Array.from(files));
    }
    $(event.target).val(null);
    // If you want to focus the main textarea, you'd need to lift the ref to the parent component
    // or pass a ref/callback to set the focus.
  };

  return (
    <input
      name="attachment-input"
      type="file"
      className="hidden attachment-input"
      accept="image/*, video/*, audio/*"
      multiple
      onChange={attachmentsChanged}
    />
  );
};

export default FileAttachment;
