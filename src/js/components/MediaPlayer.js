import { Component } from '../lib/preact.js';
import {html} from '../Helpers.js';
import State from '../State.js';
import Icons from '../Icons.js';
import Helpers from '../Helpers.js';

const isOfType = (f, types) => types.indexOf(f.name.slice(-4))  !== -1;
const isImage = f => isOfType(f, ['.jpg', 'jpeg', '.gif', '.png']);

class MediaPlayer extends Component {
  componentDidMount() {
    State.local.get('player').on(player => {
      const torrentId = player && player.torrentId;
      const filePath = player && player.filePath;
      if (torrentId !== this.torrentId) {
        this.filePath = filePath;
        this.torrentId = torrentId;
        this.setState({torrentId, isOpen: !!player, splitPath: filePath && filePath.split('/')});
        if (torrentId) {
          this.startTorrenting();
        }
      } else if (filePath && filePath !== this.filePath) {
        this.filePath = filePath;
        this.setState({splitPath: filePath && filePath.split('/')})
        this.openFile();
      }
    });
    State.local.get('player').get('paused').on(paused => {
      const el = $(this.base).find('audio').get(0);
      el && (paused ? el.pause() : el.play());
    });
  }

  onTorrent(torrent) {
    this.torrent = torrent;
    const img = torrent.files.find(f => isImage(f));
    let poster = torrent.files.find(f => isImage(f) && (f.name.indexOf('cover') > -1 || f.name.indexOf('poster') > -1));
    poster = poster || img;
    const el = $(this.base).find('.cover');
    el.empty();
    poster && poster.appendTo(el.get(0));
    this.openFile();
  }

  openFile() {
    if (this.torrent) {
      const file = this.torrent.files.find(f => f.path === this.filePath);
      const el = $(this.base).find('.player');
      el.empty();
      file && file.appendTo(el.get(0), {autoplay: true, muted: false});
    }
  }

  startTorrenting() {
    const client = Helpers.getWebTorrentClient();
    const existing = client.get(this.torrentId);
    if (existing) {
      this.onTorrent(existing);
    } else {
      client.add(this.torrentId, t => this.onTorrent(t));
    }
  }

  render() {
    const s = this.state;
    return s.isOpen ? html`
      <div class="media-player">
        <div class="player"></div>
        <div class="cover"></div>
        <a href="/torrent/${encodeURIComponent(this.state.torrentId)}" class="info">
          ${s.splitPath ? s.splitPath.map(
            (str, i) => {
              if (i === s.splitPath.length - 1) {
                if (s.isAudioOpen) {
                  str = str.split('.').slice(0, -1).join('.');
                }
                return html`<p><b>${str}</b></p>`;
              } else {
                return html`<p>${str}</p>` 
              }
            }
          ):''}
        </a>
        <div class="close" onClick=${() => State.local.get('player').put(null)}>${Icons.close}</div>
      </div>
    ` : '';
  }
}

export default MediaPlayer;
