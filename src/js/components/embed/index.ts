import { Event } from 'nostr-tools';
import { JSX } from 'preact';

import InlineMention from './nostr/InlineMention';
import Nip19 from './nostr/Nip19';
import NostrEvent from './nostr/NostrNote';
import NostrNpub from './nostr/NostrNpub';
import SpotifyTrack from './spotify/SpotifyTrack';
import Hashtag from './Hashtag';
import Image from './Image';
import Instagram from './Instagram';
import SoundCloud from './SoundCloud';
import Twitter from './Twitter';
import Url from './Url';
import Video from './Video';
import Youtube from './YouTube';

export type EmbedProps = {
  match: string;
  index?: number;
  event?: Event;
  key: string;
};

type Embed = {
  regex: RegExp;
  component: (props: EmbedProps) => JSX.Element;
};

export const allEmbeds = [
  Image,
  Video,
  Youtube,
  Instagram,
  Twitter,
  SoundCloud,
  SpotifyTrack,
  NostrNpub,
  NostrEvent,
  Nip19,
  Hashtag,
  InlineMention,
  Url,
];

export const textEmbeds = [NostrNpub, Url, Hashtag];

export default Embed;
