import Embed from '../index';

const ApplePodcast: Embed = {
  regex: /(?:https?:\/\/)(?:.*?)(music\.apple\.com\/.*)/gi,
  settingsKey: 'enableAppleMusic',
  component: ({ match }) => {
    const cssClass = match.includes('?i=') ? 'applepodcast-small' : 'applepodcast-large';
    return (
      <iframe
        // class="applepodcast"
        className={cssClass}
        scrolling="no"
        width="650"
        height="175"
        style={{ maxWidth: '100%' }}
        src={`https://embed.${match}`}
        frameBorder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  },
};

export default ApplePodcast;
