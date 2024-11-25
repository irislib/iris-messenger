export const uploadFile = (file, onUrlCallback, onErrorCallback, key) => {
  const uploadApiUrl = 'https://nostr.build/api/v2/upload/files';

  const authEvent = {
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    content: '',
    tags: [
      ['u', uploadApiUrl],
      ['method', 'POST'],
    ],
    pubkey: key.getPubKey(), // assuming 'key' is an instance of your Key class or has a similar interface
  };

  key
    .sign(authEvent) // assuming 'key' is an instance of your Key class or has a similar interface
    .then((signature) => {
      (authEvent as any).sig = signature;
      const authHeader = `Nostr ${btoa(JSON.stringify(authEvent))}`;

      const formData = new FormData();
      formData.append('fileToUpload', file);

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
      if (response.status === 200 && uploadResult?.status === 'success' && onUrlCallback) {
        const url = uploadResult.data[0].url;
        onUrlCallback(url);
      } else {
        throw new Error('Upload failed: ' + JSON.stringify(uploadResult));
      }
    })
    .catch((error) => {
      console.error('upload error', error);
      if (onErrorCallback) {
        onErrorCallback('upload failed: ' + JSON.stringify(error));
      }
    });
};
