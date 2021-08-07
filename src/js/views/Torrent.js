import { html } from 'htm/preact';
import Torrent from '../components/Torrent.js';
import View from './View.js';

class TorrentView extends View {
  constructor() {
    super();
    this.class = "public-messages-view";
  }

  renderView() {
    return html`
      <div id="message-list" class="centered-container">
        <${Torrent} showFiles=${true} torrentId=${this.props.id}/>
      </div>
    `;
  }
}

export default TorrentView;
