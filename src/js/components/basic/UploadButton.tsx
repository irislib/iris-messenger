import React, { useState } from 'react';

const UploadButton = (props) => {
  const [error, setError] = useState(null);
  const handleFileUpload = (event) => {
    const files = event.target.files || event.dataTransfer.files;
    if (files && files.length) {
      const formData = new FormData();
      formData.append('fileToUpload', files[0]);

      fetch('https://nostr.build/upload.php', {
        method: 'POST',
        body: formData,
      })
        .then(async (response) => {
          const text = await response.text();
          const url = text.match(
            /https:\/\/nostr\.build\/(?:i|av)\/nostr\.build_[a-z0-9]{64}\.[a-z0-9]+/i,
          );
          if (url && props.onUrl) {
            props.onUrl(url[0]);
          }
        })
        .catch((error) => {
          console.error('upload error', error);
          setError('upload failed: ' + JSON.stringify(error));
        });
    }
  };

  return (
    <>
      <input type="file" onChange={handleFileUpload} />
      {error ? <p>{error}</p> : null}
    </>
  );
};

export default UploadButton;
