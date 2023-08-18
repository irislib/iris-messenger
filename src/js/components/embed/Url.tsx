import { Link } from 'preact-router';

import Embed from './index';

const Url: Embed = {
  regex: /(https?:\/\/[^\s]+)/g,
  component: ({ match }) => {
    const url = match.replace(/^(https:\/\/)?iris.to/, '');
    return (
      <Link className="link" target={url === match ? '_blank' : '_self'} href={url}>
        {match.replace(/^https?:\/\//, '').replace(/\/$/, '')}
      </Link>
    );
  },
};

export default Url;
