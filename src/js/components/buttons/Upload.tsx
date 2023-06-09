import { useState } from "react";

const Upload = (props) => {
  const [error, setError] = useState("");
  const handleFileUpload = (event) => {
    const files = event.target.files || event.dataTransfer.files;
    if (files && files.length) {
      const formData = new FormData();
      formData.append("fileToUpload", files[0]);

      fetch("https://nostr.build/api/upload/iris.php", {
        method: "POST",
        body: formData,
      })
        .then(async (response) => {
          const url = await response.json();
          if (url && props.onUrl) {
            props.onUrl(url);
          }
        })
        .catch((error) => {
          console.error("upload error", error);
          setError("upload failed: " + JSON.stringify(error));
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

export default Upload;
