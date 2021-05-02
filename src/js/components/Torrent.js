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
    if (Session.settings.local.enableWebtorrent) {
      this.startTorrenting();
    }
  }

  onPlay(e) {
    !e.target.muted && $('#media-player').empty() && $('#media-player-container').hide();
  }

  componentWillUnmount() {
    const mediaEl = $(this.base).find('audio').get(0);
    if (mediaEl && !mediaEl.paused && !mediaEl.muted) { // TODO: do this the preact way
      const player = $('#media-player');
      const info = $('#media-info');
      const cover = $('#media-cover');
      mediaEl.removeEventListener('play', this.onPlay);
      mediaEl.removeEventListener('volumechange', this.onPlay);
      player.empty();
      player[0].appendChild(mediaEl);
      info.empty();
      info[0].appendChild($(this.base).find('.info').get(0));
      cover.empty();
      cover[0].appendChild($(this.base).find('.cover').get(0));
      $('#media-player-container').show();
    }
  }

  startTorrenting(clicked) {
    this.setState({torrenting: true});
    const torrentId = this.props.torrentId;
    const client = Helpers.getWebTorrentClient();
    const existing = client.get(torrentId);
    if (existing) {
      console.log('opening existing', torrentId);
      this.onTorrent(existing, clicked);
    } else {
      console.log('adding webtorrent', torrentId);
      client.add(torrentId, t => this.onTorrent(t, clicked));
    }
  }

  openFile(file, clicked) {
    const base = $(this.base);
    if (this.state.activeFilePath === file.path) {
      return base.find('video, audio').get(0).play();
    }
    const isVid = isVideo(file);
    const isAud = !isVid && isAudio(file);

    let splitPath;
    if (!isVid) {
      splitPath = file.path.split('/');
    }
    this.setState({activeFilePath: file.path, splitPath, isAudioOpen: isAud});
    let autoplay, muted;
    if (clicked) {
      autoplay = true;
      muted = false;
    } else {
      autoplay = isVid && Session.settings.local.autoplayWebtorrent;
      muted = autoplay;
    }
    const el = base.find('.player');
    el.empty();
    file.appendTo(el[0], {autoplay, muted});
    base.find('.info').toggle(!isVid);
    const player = base.find('video, audio').get(0);
    if (player) {
      player.addEventListener('ended', () => {
        const typeCheck = player.tagName === 'VIDEO' ? isVideo : isAudio;
        this.openNextFile(typeCheck);
      });
      player.addEventListener('play', this.onPlay);
      player.addEventListener('volumechange', this.onPlay);
    }
  }

  getNextIndex(typeCheck) {
    const files = this.state.torrent.files;
    const currentIndex = files.findIndex(f => f.path === this.state.activeFilePath);
    let nextIndex = files.findIndex((f, i) => i > currentIndex && typeCheck(f));
    if (nextIndex === -1) {
      nextIndex = files.findIndex(f => typeCheck(f));
    }
    if (nextIndex === -1) {
      nextIndex = currentIndex;
    }
    return nextIndex;
  }
  
  openNextFile(typeCheck) {
    const nextIndex = this.getNextIndex(typeCheck);
    this.openFile(this.state.torrent.files[nextIndex], true);
  }

  onTorrent(torrent, clicked) {
    console.log('got torrent', torrent);
    const video = torrent.files.find(f => isVideo(f));
    const audio = torrent.files.find(f => isAudio(f));
    const img = torrent.files.find(f => isImage(f));
    let poster = torrent.files.find(f => isImage(f) && (f.name.indexOf('cover') > -1 || f.name.indexOf('poster') > -1));
    poster = poster || img;
    poster && poster.appendTo($(this.base).find('.cover').get(0));
    const file = video || audio || img || torrent.files[0];
    this.setState({torrent, cover: img});
    file && this.openFile(file, clicked);
  }

  showFilesClicked(e) {
    e.preventDefault();
    this.setState({showFiles: !this.state.showFiles});
  }

  openTorrentClicked(e) {
    e.preventDefault();
    this.startTorrenting(true);
  }

  render() {
    const s = this.state;
    const t = s.torrent;
    return html`
        <div class="torrent">
            ${!Session.settings.local.enableWebtorrent && !s.torrenting ? html`
              <a href="" onClick=${e => this.openTorrentClicked(e)}>Show attachment</a>
            `:''}
            ${s.torrenting && !s.torrent ? html`<p>Loading attachment...</p>`:''}
            <div class="cover" style=${s.isAudioOpen ? '' : 'display:none'}></div>
            <div class="info">
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
            </div>
            ${s.hasNext ? html`<b>prev</b>`:''}
            <div class="player"></div>
            ${s.hasNext ? html`<b>next</b>`:''}
            <a href=${this.props.torrentId}>Magnet link</a>
            ${t && t.files ? html`
                <a href="" style="margin-left:30px;" onClick=${e => this.showFilesClicked(e)}>${tr('show_details')}</a>
            `:''}
            ${s.showFiles && t && t.files ? html`
              <p>${tr('peers')}: ${t.numPeers}</p>
              <div class="flex-table details">
                ${t.files.map(f => html`
                  <div onClick=${() => this.openFile(f, true)} class="flex-row ${s.activeFilePath === f.path ? 'active' : ''}">
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
