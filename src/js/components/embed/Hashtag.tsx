import { Link } from 'preact-router';

import Embed from './index';

const Hashtag: Embed = {
  regex: /(?<=\s|^)(#\w+)/g,
  component: ({ match, key }) => {
    return (
      <Link key={key} href={`/search/${encodeURIComponent(match)}`} className="link">
        {' '}
        {match}{' '}
      </Link>
    );
  },
};

export default Hashtag;
