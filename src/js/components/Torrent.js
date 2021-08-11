import Component from '../BaseComponent';
import { createRef } from 'preact';
import Helpers from '../Helpers.js';
import { html } from 'htm/preact';
import Session from "../Session.js";
import { translate as tr } from '../Translation.js';
import $ from 'jquery';
import State from '../State.js';
import Icons from '../Icons.js';
import {Helmet} from 'react-helmet';

const isOfType = (f, types) => types.indexOf(f.name.slice(-4))  !== -1;
const isVideo = f => isOfType(f, ['webm', '.mp4', '.ogg']);
const isAudio = f => isOfType(f, ['.mp3', '.wav', '.m4a']);
const isImage = f => isOfType(f, ['.jpg', 'jpeg', '.gif', '.png']);

class Torrent extends Component {
  coverRef = createRef();

  componentDidMount() {
    State.local.get('player').on(this.sub(
      (player) => {
        this.player = player;
        this.setState({player});
        if (this.torrent && this.player && this.player.filePath !== this.state.activeFilePath) {
          const file = this.getActiveFile(this.torrent);
          file && this.openFile(file);
        }
      }
    ));
    const showFiles = this.props.showFiles;
    showFiles && this.setState({showFiles});
    if (Session.settings.local.enableWebtorrent) {
      this.startTorrenting();
    }
  }

  measure() {
    (typeof this.props.measure === 'function') && this.props.measure();
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.observer && this.observer.disconnect();
    delete this.observer;
  }

  onPlay(e) {
    if (!e.target.muted) {
      State.local.get('player').get('paused').put(true);
    }
  }

  async startTorrenting(clicked) {
    this.setState({torrenting: true});
    const torrentId = this.props.torrentId;
    const client = await Helpers.getWebTorrentClient();
    const existing = client.get(torrentId);
    if (existing) {
      this.onTorrent(existing, clicked);
    } else {
      client.add(torrentId, t => this.onTorrent(t, clicked));
    }
  }

  playAudio(filePath, e) {
    e && e.preventDefault();
    State.local.get('player').put({torrentId: this.props.torrentId, filePath, paused: false});
  }

  pauseAudio(e) {
    e && e.preventDefault();
    State.local.get('player').put({paused: true});
  }

  openFile(file, clicked) {
    const base = $(this.base);
    const isVid = isVideo(file);
    const isAud = !isVid && isAudio(file);
    if (this.state.activeFilePath === file.path) {
      if (isVid) {
        const el = base.find('video').get(0);
        el && el.play();
      } else if (isAud) {
        State.local.get('player').get('paused').put(false);
      }
      return;
    }

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
    if (isAud && clicked) {
      this.playAudio(file.path);
    }
    if (!isAud) {
      file.appendTo(el.get(0), {autoplay, muted});
    }
    if (isVid && this.props.autopause) {
      const vid = base.find('video').get(0);
      const handlePlay = (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            autoplay && vid.play();
          } else {
            vid.pause();
          }
        });
      }
      const options = {
        rootMargin: "0px",
        threshold: [0.25, 0.75]
      };
      this.observer = new IntersectionObserver(handlePlay, options);
      this.observer.observe(vid);
    }

    base.find('.info').toggle(!isVid);
    const player = base.find('video, audio').get(0);
    if (player) {
      player.addEventListener('ended', () => {
        const typeCheck = player.tagName === 'VIDEO' ? isVideo : isAudio;
        this.openNextFile(typeCheck);
      });
      player.onplay = player.onvolumechange = this.onPlay;
    }
    setTimeout(() => this.measure());
    setTimeout(() => this.measure(), 100);
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

  getActiveFile(torrent) {
    const p = this.player;
    let file;
    if (p && p.torrentId === this.props.torrentId) {
      file = torrent.files.find(f => {
        return f.path === p.filePath;
      });
    }
    return file;
  }

  onTorrent(torrent, clicked) {
    if (!this.coverRef.current) { return; }
    this.torrent = torrent;
    const video = torrent.files.find(f => isVideo(f));
    const audio = torrent.files.find(f => isAudio(f));
    const img = torrent.files.find(f => isImage(f));
    let poster = torrent.files.find(f => isImage(f) && (f.name.indexOf('cover') > -1 || f.name.indexOf('poster') > -1));
    poster = poster || img;
    poster && poster.appendTo(this.coverRef.current);

    const file = this.getActiveFile(torrent) || video || audio || img || torrent.files[0];
    this.setState({torrent, cover: img});
    file && this.openFile(file, clicked);
  }

  showFilesClicked(e) {
    e.preventDefault();
    this.setState({showFiles: !this.state.showFiles});
    setTimeout(() => this.measure());
  }

  openTorrentClicked(e) {
    e.preventDefault();
    this.startTorrenting(true);
  }

  render() {
    const s = this.state;
    const t = s.torrent;
    const p = s.player;
    const playing = p && p.torrentId === this.props.torrentId && !p.paused;
    let playButton = '';
    if (s.isAudioOpen) {
      playButton = playing ? html`
          <a href="#" onClick=${e => this.pauseAudio(e)}>${Icons.pause}</a>
      `: html`
          <a href="#" onClick=${e => this.playAudio(s.activeFilePath, e)}>${Icons.play}</a>
      `;
    }
    const title = s.splitPath && s.splitPath[s.splitPath.length - 1].split('.').slice(0, -1).join('.') || 'File sharing';
    const ogTitle = `${title} | Iris`;
    const description = 'Shared files';
    const ogType = s.isAudioOpen ? 'music:song' : 'video.movie';
    return html`
        <div class="torrent">
            ${this.props.standalone ? html`
              <${Helmet}>
                <title>${title}</title>
                <meta name="description" content=${description} />
                <meta property="og:type" content=${ogType} />
                <meta property="og:title" content=${ogTitle} />
                <meta property="og:description" content=${description} />
              <//>
            ` : ''}
            ${!Session.settings.local.enableWebtorrent && !s.torrenting ? html`
              <a href="" onClick=${e => this.openTorrentClicked(e)}>Show attachment</a>
            `:''}
            ${s.torrenting && !s.torrent ? html`<p>Loading attachment...</p>`:''}
            <div class="cover" ref=${this.coverRef} style=${s.isAudioOpen ? '' : 'display:none'}></div>
            <div class="info">
                ${s.splitPath ? s.splitPath.map(
                  (str, i) => {
                    if (i === s.splitPath.length - 1) {
                      if (s.isAudioOpen) {
                        str = str.split('.').slice(0, -1).join('.');
                      }
                      return html`<p><b>${str}</b></p>`;
                    } 
                      return html`<p>${str}</p>` 
                    
                  }
                ):''}
            </div>
            ${s.hasNext ? html`<b>prev</b>`:''}
            <div class="player">
                ${playButton}
            </div>
            ${s.hasNext ? html`<b>next</b>`:''}
            ${(this.props.standalone || this.props.preview) ? html`
              <a href=${this.props.torrentId}>Magnet link</a>
              ${t && t.files ? html`
                  <a href="" style="margin-left:30px;" onClick=${e => this.showFilesClicked(e)}>${tr(
                    s.showFiles ? 'hide_files' : 'show_files'
                  )}</a>
              `:''}
            ` : html`
                <a href="/torrent/${encodeURIComponent(this.props.torrentId)}">${tr('show_files')}</a>
            `}
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
