import Embed from '../index';

const SpotifyTrack: Embed = {
  regex: /(?:https?:\/\/)?(?:www\.)?(?:open\.spotify\.com\/track\/)([\w-]+)(?:\S+)?/g,
  settingsKey: 'enableSpotify',
  component: ({ match }) => {
    return (
      <iframe
        className="audio"
        scrolling="no"
        width="650"
        height="200"
        src={`https://open.spotify.com/embed/track/${match}?utm_source=oembed`}
        frameBorder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  },
};

export default SpotifyTrack;
