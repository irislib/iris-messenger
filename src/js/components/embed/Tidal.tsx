import Embed from './index';

const Tidal: Embed = {
  regex: /(?:https?:\/\/)?(?:www\.)?(?:tidal\.com(?:\/browse)?\/track\/)([\d]+)?/g,
  settingsKey: 'enableTidal',
  component: ({ match }) => {
    return (
      <iframe
        className="audio"
        scrolling="no"
        width="650"
        height="200"
        style={{ maxWidth: '100%' }}
        src={`https://embed.tidal.com/tracks/${match}?layout=gridify`}
        frameBorder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  },
};

export default Tidal;
