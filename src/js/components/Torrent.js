import { Component } from '../lib/preact.js';
import Helpers, {html} from '../Helpers.js';
import Session from "../Session.js";
import { translate as tr } from '../Translation.js';

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

  setActiveFile(file) {
    if (this.state.activeFilePath === file.path) return;
    this.setState({activeFilePath: file.path});
   // Stream the file in the browser
    const autoplay = Session.settings.local.autoplayWebtorrent;
    const el = $(this.base).find('.player');
    el.empty();
    file.appendTo(el[0], {autoplay, muted: autoplay});
  }

  onTorrent(torrent) {
    // Torrents can contain many files. Let's use the .mp4 file
    console.log('got torrent', torrent);
    this.setState({torrent});
    const file = torrent.files[0];
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
            <div class="player"></div>
            <a href=${this.props.torrentId} style="margin-right:7px;">Magnet link</a>
            ${t && t.files ? html`
                <a href="" onClick=${e => this.showFilesClicked(e)}>${tr('details')}</a>
            `:''}
            ${s.showFiles && t && t.files ? html`
              <div class="flex-table details">
                ${t.files.map(f => html`
                  <div onClick=${() => this.setActiveFile(f)} class="flex-row ${s.activeFilePath === f.path ? 'active' : ''}">
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
