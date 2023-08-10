export const uploadFile = (file, onUrlCallback, onErrorCallback) => {
  const formData = new FormData();
  formData.append('fileToUpload', file);

  fetch('https://nostr.build/api/upload/iris.php', {
    method: 'POST',
    body: formData,
  })
    .then(async (response) => {
      const url = await response.json();
      if (url && onUrlCallback) {
        onUrlCallback(url);
      }
    })
    .catch((error) => {
      console.error('upload error', error);
      if (onErrorCallback) {
        onErrorCallback('upload failed: ' + JSON.stringify(error));
      }
    });
};
