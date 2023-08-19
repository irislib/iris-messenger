import { Event } from 'nostr-tools';

import Helpers from '@/utils/Helpers';

import Events from '../../nostr/Events.js';
import Key from '../../nostr/Key.js';

function handleTags(tags = [] as any[], text) {
  function handleTagged(regex, tagType) {
    const taggedItems = [...text.matchAll(regex)]
      .map((m) => m[0])
      .filter((m, i, a) => a.indexOf(m) === i);

    if (taggedItems) {
      for (const tag of taggedItems) {
        const match = tag.match(/npub[a-zA-Z0-9]{59,60}/)?.[0];
        const hexTag = match && Key.toNostrHexAddress(match);
        if (!hexTag) {
          continue;
        }
        const newTag = [tagType, hexTag, '', 'mention'];
        // add if not already present
        if (!tags?.find((t) => t[0] === newTag[0] && t[1] === newTag[1])) {
          tags.push(newTag);
        }
      }
    }
  }

  handleTagged(Helpers.pubKeyRegex, 'p');
  handleTagged(Helpers.noteRegex, 'e');

  const hashtags = [...text.matchAll(Helpers.hashtagRegex)].map((m) => m[0].slice(1));
  if (hashtags.length) {
    for (const hashtag of hashtags) {
      if (!tags?.find((t) => t[0] === 't' && t[1] === hashtag)) {
        tags.push(['t', hashtag]);
      }
    }
  }

  return tags;
}

export async function sendNostr(msg: { text: string; replyingTo?: string }) {
  const event = {
    kind: 1,
    content: msg.text,
  } as any;

  if (msg.replyingTo) {
    const id = Key.toNostrHexAddress(msg.replyingTo);
    if (!id) {
      throw new Error('invalid replyingTo');
    }
    const replyingTo: Event = await new Promise((resolve) => {
      Events.getEventById(id, true, (e) => resolve(e));
    });
    event.tags = replyingTo.tags.filter((tag) => tag[0] === 'p');
    let rootTag = replyingTo.tags?.find((t) => t[0] === 'e' && t[3] === 'root');
    if (!rootTag) {
      rootTag = replyingTo.tags?.find((t) => t[0] === 'e');
    }
    if (rootTag) {
      event.tags.unshift(['e', id, '', 'reply']);
      event.tags.unshift(['e', rootTag[1], '', 'root']);
    } else {
      event.tags.unshift(['e', id, '', 'root']);
    }
    if (!event.tags?.find((t) => t[0] === 'p' && t[1] === replyingTo.pubkey)) {
      event.tags.push(['p', replyingTo.pubkey]);
    }
  }

  event.tags = handleTags(event.tags, msg.text);

  console.log('sending event', event);
  return Events.publish(event);
}
