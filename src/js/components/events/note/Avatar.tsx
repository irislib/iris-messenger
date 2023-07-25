import Key from '../../../nostr/Key';
import Show from '../../helpers/Show';
import Avatar from '../../user/Avatar';

const NoteAvatar = ({ event, isQuote, standalone }) => (
  <span className="flex flex-col items-center flex-shrink-0 mr-2">
    <Show when={event.pubkey}>
      <a href={`/${event.pubkey}`}>
        <Avatar str={Key.toNostrBech32Address(event.pubkey, 'npub')} width={40} />
      </a>
    </Show>
    <Show when={isQuote && !standalone}>
      <div className="border-l-2 border-neutral-700 h-full"></div>
    </Show>
  </span>
);

export default NoteAvatar;
