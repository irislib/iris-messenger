import Embed from './index';

const TikTok: Embed = {
  regex: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/.*?video\/(\d{1,19})/g,
  settingsKey: 'enableTikTok',
  component: ({ match }) => {
    return (
      <iframe
        className="tiktok"
        width="605"
        height="400"
        style={{ maxWidth: '100%' }}
        src={`https://www.tiktok.com/embed/v2/${match}`}
        frameBorder="1"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  },
};

export default TikTok;
