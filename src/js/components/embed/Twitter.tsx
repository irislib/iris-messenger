import Embed from './index';

const Twitter: Embed = {
  regex: /(?:^|\s)(?:@)?(https?:\/\/twitter.com\/\w+\/status\/\d+\S*)(?![\w/])/g,
  settingsKey: 'enableTwitter',
  component: ({ match }) => {
    return (
      <iframe
        style={{
          maxWidth: '350px',
          height: '450px',
          backgroundColor: 'white',
          display: 'block',
        }}
        scrolling="no"
        height={250}
        width={550}
        src={`https://twitframe.com/show?url=${encodeURIComponent(match)}`}
      />
    );
  },
};

export default Twitter;
