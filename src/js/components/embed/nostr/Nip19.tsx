import { nip19 } from 'nostr-tools';
import { Link } from 'preact-router';

import EventComponent from '../../events/EventComponent';
import Name from '../../user/Name';
import Embed from '../index';

const nip19Regex = /\bnostr:(n(?:event|profile)1\w+)\b/g;

const NostrUser: Embed = {
  regex: nip19Regex,
  component: ({ match }) => {
    try {
      const { type, data } = nip19.decode(match);
      if (type === 'nprofile') {
        return (
          <>
            <Link className="link" href={`/${data.pubkey}`}>
              <Name pub={data.pubkey} />
            </Link>
          </>
        );
      } else if (type === 'nevent') {
        // same as note
        return <EventComponent id={data.id} asInlineQuote={true} />;
      }
    } catch (e) {
      console.log(e);
    }
    return <span>{match}</span>;
  },
};

export default NostrUser;
