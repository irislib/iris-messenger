import Show from '@/components/helpers/Show';
import SafeImg from '@/components/SafeImg';
import Torrent from '@/components/Torrent';

const AttachmentPreview = ({ attachments, torrentId, removeAttachments }) => {
  return (
    <>
      <Show when={torrentId}>
        <Torrent preview={true} torrentId={torrentId} />
      </Show>
      <Show when={attachments && attachments.length}>
        <p>
          <a
            href=""
            onClick={(e) => {
              e.preventDefault();
              removeAttachments();
            }}
          >
            Remove Attachment
          </a>
        </p>
      </Show>
      {attachments &&
        attachments.map((a) => {
          const status = a.error ? <span class="error">{a.error}</span> : a.url || 'uploading...';

          if (a.type?.startsWith('audio')) {
            return (
              <>
                {status}
                <audio controls>
                  <source src={a.data} />
                </audio>
              </>
            );
          }
          if (a.type?.startsWith('video')) {
            return (
              <>
                {status}
                <video controls loop={true} autoPlay={true} muted={true}>
                  <source src={a.data} />
                </video>
              </>
            );
          }
          if (a.type?.startsWith('image')) {
            return (
              <>
                {status}
                <SafeImg src={a.data} />
              </>
            );
          }

          return 'unknown attachment type';
        })}
    </>
  );
};

export default AttachmentPreview;
