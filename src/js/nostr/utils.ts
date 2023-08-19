import { Event } from 'nostr-tools';

import Key from '@/nostr/Key';

export function getRepostedEventId(event: Event) {
  let id = event.tags?.find((tag) => tag[0] === 'e' && tag[3] === 'mention')?.[1];
  if (id) {
    return id;
  }
  // last e tag is the reposted post
  id = event.tags
    .slice() // so we don't reverse event.tags in place
    .reverse()
    .find((tag: any) => tag[0] === 'e')?.[1];
  return id;
}
export function getOriginalPostEventId(event: Event) {
  return isRepost(event) ? getRepostedEventId(event) : event.id;
}
export function getNoteReplyingTo(event: Event) {
  if (event.kind !== 1) {
    return undefined;
  }
  return getEventReplyingTo(event);
}
export function getEventReplyingTo(event: Event) {
  const replyTags = event.tags?.filter((tag) => tag[0] === 'e' && tag[3] !== 'mention');
  if (replyTags.length === 1) {
    return replyTags[0][1];
  }
  const replyTag = event.tags?.find((tag) => tag[0] === 'e' && tag[3] === 'reply');
  if (replyTag) {
    return replyTag[1];
  }
  if (replyTags.length > 1) {
    return replyTags[1][1];
  }
  return undefined;
}

export function isRepost(event: Event) {
  if (event.kind === 6) {
    return true;
  }
  const mentionIndex = event.tags?.findIndex((tag) => tag[0] === 'e' && tag[3] === 'mention');
  if (event.kind === 1 && event.content === `#[${mentionIndex}]`) {
    return true;
  }
  return false;
}

export function getZappingUser(event: Event, npub = true) {
  const description = event.tags?.find((t) => t[0] === 'description')?.[1];
  if (!description) {
    return null;
  }
  let obj;
  try {
    obj = JSON.parse(description);
  } catch (e) {
    return null;
  }
  if (npub) {
    Key.toNostrBech32Address(obj.pubkey, 'npub');
  }
  return obj.pubkey;
}

export function getEventRoot(event: Event) {
  const rootEvent = event?.tags?.find((t) => t[0] === 'e' && t[3] === 'root')?.[1];
  if (rootEvent) {
    return rootEvent;
  }
  // first e tag
  return event?.tags?.find((t) => t[0] === 'e')?.[1];
}

export function getLikedEventId(event: Event) {
  if (!event.tags) {
    return undefined;
  }
  return event.tags
    .slice()
    .reverse()
    .find((tag: any) => tag[0] === 'e')?.[1];
}
