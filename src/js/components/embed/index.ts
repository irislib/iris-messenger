import { Event } from 'nostr-tools';
import { JSX } from 'preact';

import AppleMusic from './apple/AppleMusic';
import ApplePodcast from './apple/ApplePodcast';
import InlineMention from './nostr/InlineMention';
import Nip19 from './nostr/Nip19';
import NostrEvent from './nostr/NostrNote';
import NostrNpub from './nostr/NostrNpub';
import SpotifyAlbum from './spotify/SpotifyAlbum';
import SpotifyPlaylist from './spotify/SpotifyPlaylist';
import SpotifyPodcast from './spotify/SpotifyPodcast';
import SpotifyTrack from './spotify/SpotifyTrack';
import Twitch from './twitch/Twitch';
import TwitchChannel from './twitch/TwitchChannel';
import Audio from './Audio';
import Hashtag from './Hashtag';
import Image from './Image';
import Instagram from './Instagram';
import LightningUri from './LightningUri';
import SoundCloud from './SoundCloud';
import Tidal from './Tidal';
import TikTok from './TikTok';
import Twitter from './Twitter';
import Url from './Url';
import Video from './Video';
import WavLake from './WavLake';
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
  settingsKey?: string;
};

export const allEmbeds = [
  Audio,
  Image,
  Video,
  Youtube,
  Instagram,
  Twitter,
  SoundCloud,
  SpotifyTrack,
  SpotifyAlbum,
  SpotifyPodcast,
  SpotifyPlaylist,
  AppleMusic,
  ApplePodcast,
  Tidal,
  TikTok,
  Twitch,
  TwitchChannel,
  WavLake,
  LightningUri,
  NostrNpub,
  NostrEvent,
  Nip19,
  Hashtag,
  InlineMention,
  Url,
];

export const textEmbeds = [NostrNpub, Url, Hashtag];

export default Embed;
