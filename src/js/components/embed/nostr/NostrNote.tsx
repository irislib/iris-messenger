import Key from '../../../nostr/Key';
import EventComponent from '../../events/EventComponent';
import Embed from '../index';

const eventRegex =
  /(?:^|\s|nostr:|(?:https?:\/\/[\w./]+)|iris\.to\/|snort\.social\/e\/|damus\.io\/)+((?:@)?note[a-zA-Z0-9]{59,60})(?![\w/])/gi;

const NostrUser: Embed = {
  regex: eventRegex,
  component: ({ match }) => {
    const hex = Key.toNostrHexAddress(match.replace('@', ''))!;
    return <EventComponent id={hex} asInlineQuote={true} />;
  },
};

export default NostrUser;
