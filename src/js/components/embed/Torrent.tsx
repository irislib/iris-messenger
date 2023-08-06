import Torrent from '../Torrent';

import Embed from './index';

const TorrentEmbed: Embed = {
  regex: /(magnet:\?xt=urn:btih:.*)/gi,
  settingsKey: 'enableTorrent',
  component: ({ match }) => {
    return <Torrent preview={true} torrentId={match} />;
  },
};

export default TorrentEmbed;
