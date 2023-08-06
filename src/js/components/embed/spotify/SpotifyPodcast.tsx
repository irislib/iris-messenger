import Embed from '../index';

const SpotifyPodcast: Embed = {
  regex: /(?:https?:\/\/)?(?:www\.)?(?:open\.spotify\.com\/episode\/)([\w-]+)(?:\S+)?(?:t=(\d+))?/g,
  settingsKey: 'enableSpotify',
  component: ({ match }) => {
    return (
      <iframe
        class="audio"
        scrolling="no"
        width="650"
        height="200"
        style={{ maxWidth: '100%' }}
        src={`https://open.spotify.com/embed/episode/${match}`}
        frameBorder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  },
};

export default SpotifyPodcast;
