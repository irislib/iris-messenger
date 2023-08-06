import Embed from '../index';

const Twitch: Embed = {
  regex: /(?:https?:\/\/)?(?:www\.)?(?:twitch\.tv\/)([\w-]+)?/g,
  settingsKey: 'enableTwitch',
  component: ({ match }) => {
    return (
      <iframe
        className="video"
        scrolling="no"
        width="650"
        height="400"
        style={{ maxWidth: '100%' }}
        src={`https://player.twitch.tv/?channel=${match}&parent=${window.location.hostname}&autoplay=false`}
        frameBorder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  },
};

export default Twitch;
