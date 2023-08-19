import { Link } from 'preact-router';

import Embed from './index';

const Hashtag: Embed = {
  // Using a non-capturing group for prefix and capturing everything after
  regex: /(?:\s|^)(#\w+)/g,
  component: ({ match }) => {
    // Split the prefix and the hashtag using the first character (assuming it's always #)
    return (
      <>
        {' '}
        <Link href={`/search/${encodeURIComponent(match)}`} className="link">
          {match}
        </Link>
      </>
    );
  },
};

export default Hashtag;
