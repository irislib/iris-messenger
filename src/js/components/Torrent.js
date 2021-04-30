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

  onTorrent(torrent) {
    // Torrents can contain many files. Let's use the .mp4 file
    console.log('got torrent', torrent);
    this.setState({torrent});
    const file = torrent.files[0];

    // Stream the file in the browser
    const autoplay = Session.settings.local.autoplayWebtorrent;
    file && file.appendTo($(this.base).find('.player')[0], {autoplay, muted: autoplay})
  }

  showFilesClicked(event) {
    event.preventDefault();
    this.setState({showFiles: !this.state.showFiles});
  }

  render() {
    const t = this.state.torrent;
    return html`
        <div style="padding: 7px;">
            <div class="player"></div>
            <a href=${this.props.torrentId} style="margin-right:7px;">Magnet link</a>
            ${t && t.files ? html`
                <a href="" onClick=${e => this.showFilesClicked(e)}>${tr('details')}</a>
            `:''}
            ${this.state.showFiles && t && t.files ? t.files.map(f => html`<p>${f.name}</p>`) : ''}
        </div>
    `;
  }
}

export default Torrent;
