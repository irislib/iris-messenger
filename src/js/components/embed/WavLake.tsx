import Embed from './index';

const WavLake: Embed = {
  regex:
    /https:\/\/(?:player\.)?wavlake\.com\/(?!feed\/|artists)(track\/[.a-zA-Z0-9-]+|album\/[.a-zA-Z0-9-]+|[.a-zA-Z0-9-]+)/i,
  settingsKey: 'enableWavLake',
  component: ({ match }) => {
    return (
      <iframe
        height="380"
        width="100%"
        style={{ maxWidth: '100%' }}
        src={`https://embed.wavlake.com/${match}`}
        frameBorder="0"
        loading="lazy"
      />
    );
  },
};

export default WavLake;
