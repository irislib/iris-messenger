import Embed from '../index';

const SpotifyAlbum: Embed = {
  regex: /(?:https?:\/\/)?(?:www\.)?(?:open\.spotify\.com\/album\/)([\w-]+)(?:\S+)?/g,
  settingsKey: 'enableSpotify',
  component: ({ match }) => {
    return (
      <iframe
        className="audio"
        scrolling="no"
        width="650"
        height="400"
        style={{ maxWidth: '100%' }}
        src={`https://open.spotify.com/embed/album/${match}`}
        frameBorder="0"
        allow="encrypted-media"
      />
    );
  },
};

export default SpotifyAlbum;
