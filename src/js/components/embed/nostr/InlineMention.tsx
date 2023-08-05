// mentions like #[3], can refer to event or user

import { nip19 } from 'nostr-tools';
import { Link } from 'preact-router';

import EventComponent from '../../events/EventComponent';
import Name from '../../user/Name';

import Embed from '../index';

const fail = (s: string) => `#[${s}]`;

const InlineMention: Embed = {
  regex: /#\[([0-9]+)]/g,
  component: ({ match, index, event, key }) => {
    if (!event?.tags) {
      console.log('no tags', event);
      return <>{fail(match)}</>;
    }
    const tag = event.tags[parseInt(match)];
    if (!tag) {
      console.log('no matching tag', index, event);
      return <>{fail(match)}</>;
    }
    const [type, id] = tag;
    if (type === 'p') {
      return (
        <Link key={key} href={`/${nip19.npubEncode(id)}`} className="link">
          <Name pub={id} hideBadge={true} />
        </Link>
      );
    } else if (type === 'e') {
      return <EventComponent id={id} key={id} asInlineQuote={true} />;
    } else {
      console.log('unknown tag type', type, index, event);
      return <>{fail(match)}</>;
    }
  },
};

export default InlineMention;
