import { Component } from '../lib/preact.js';
import Helpers, {html} from '../Helpers.js';
import Session from "../Session.js";
import { translate as tr } from '../Translation.js';

const isOfType = (f, types) => types.indexOf(f.name.slice(-4))  !== -1;
const isVideo = f => isOfType(f, ['webm', '.mp4', '.ogg']);
const isAudio = f => isOfType(f, ['.mp3', '.wav', '.m4a']);
const isImage = f => isOfType(f, ['.jpg', 'jpeg', '.gif', '.png']);

class Torrent extends Component {
  componentDidMount() {
    if (!Session.settings.local.enableWebtorrent) return;

    const torrentId = this.props.torrentId;
    const client = Helpers.getWebTorrentClient();
    const existing = client.get(torrentId);
    if (existing) {
      console.log('opening existing', torrentId);
      this.onTorrent(existing);
    } else {
      console.log('adding webtorrent', torrentId);
      client.add(torrentId, t => this.onTorrent(t));
    }
  }

  setActiveFile(file, clicked) {
    const base = $(this.base);
    if (this.state.activeFilePath === file.path) {
      return base.find('video, audio').get(0).play();
    };
    this.setState({activeFilePath: file.path});
    let autoplay, muted;
    if (clicked) {
      autoplay = true;
      muted = false;
    } else {
      autoplay = isVideo(file) && Session.settings.local.autoplayWebtorrent;
      muted = autoplay;
    }
    const el = base.find('.player');
    el.empty();
    file.appendTo(el[0], {autoplay, muted});
    base.find('.info').toggle(!isVideo(file));
  }

  onTorrent(torrent) {
    // Torrents can contain many files. Let's use the .mp4 file
    console.log('got torrent', torrent);
    this.setState({torrent});
    const video = torrent.files.find(f => isVideo(f));
    const audio = torrent.files.find(f => isAudio(f));
    const img = torrent.files.find(f => isImage(f));
    const file = video || audio || img || torrent.files[0];
    file && this.setActiveFile(file);
  }

  showFilesClicked(event) {
    event.preventDefault();
    this.setState({showFiles: !this.state.showFiles});
  }

  render() {
    const s = this.state;
    const t = s.torrent;
    return html`
        <div class="torrent" style="padding: 7px;">
            <p class="info">${s.activeFilePath}</p>
            <div class="player"></div>
            <a href=${this.props.torrentId} style="margin-right:7px;">Magnet link</a>
            ${t && t.files ? html`
                <a href="" onClick=${e => this.showFilesClicked(e)}>${tr('show_details')}</a>
            `:''}
            ${s.showFiles && t && t.files ? html`
              <p>${tr('peers')}: ${t.numPeers}</p>
              <div class="flex-table details">
                ${t.files.map(f => html`
                  <div onClick=${() => this.setActiveFile(f, true)} class="flex-row ${s.activeFilePath === f.path ? 'active' : ''}">
                      <div class="flex-cell">${f.name}</div>
                      <div class="flex-cell no-flex">${Helpers.formatBytes(f.length)}</div>
                  </div>
                `)}
              </div>
            ` : ''}
        </div>
    `;
  }
}

export default Torrent;
