import { useState } from 'react';

import Key from '@/nostr/Key';
import { uploadFile } from '@/utils/uploadFile';

const Upload = (props) => {
  const [error, setError] = useState('');

  const handleFileUpload = (event) => {
    const files = event.target.files || event.dataTransfer.files;
    if (files && files.length) {
      uploadFile(
        files[0],
        (url) => {
          if (props.onUrl) {
            props.onUrl(url);
          }
        },
        (errorMsg) => {
          setError(errorMsg);
        },
        Key,
      );
    }
  };

  return (
    <>
      <input type="file" onChange={handleFileUpload} />
      {error ? <p>{error}</p> : null}
    </>
  );
};

export default Upload;
