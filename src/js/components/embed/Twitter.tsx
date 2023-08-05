import Embed from './index';

const Twitter: Embed = {
  regex: /(?:^|\s)(?:@)?(https?:\/\/twitter.com\/\w+\/status\/\d+\S*)(?![\w/])/g,
  component: ({ match, key }) => {
    return (
      <iframe
        style={{
          maxWidth: '350px',
          height: '450px',
          backgroundColor: 'white',
          display: 'block',
        }}
        key={key}
        scrolling="no"
        height={250}
        width={550}
        src={`https://twitframe.com/show?url=${encodeURIComponent(match)}`}
      />
    );
  },
};

export default Twitter;
