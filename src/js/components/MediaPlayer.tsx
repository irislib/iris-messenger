import { Component } from 'preact';
import { Link } from 'preact-router';

import Icons from '../Icons';
import localState from '../LocalState';

const isOfType = (f: string, types: string[]): boolean => types.indexOf(f.slice(-4)) !== -1;
const isImage = (f: { name: string }): boolean =>
  isOfType(f.name, ['.jpg', 'jpeg', '.gif', '.png']);

interface State {
  torrentId?: string;
  isOpen: boolean;
  splitPath?: string[];
}

class MediaPlayer extends Component<Record<string, never>, State> {
  private torrentId?: string;
  private filePath?: string;
  private torrent?: any;

  componentDidMount() {
    localState.get('player').on((player: any) => {
      const torrentId = player && player.torrentId;
      const filePath = player && player.filePath;
      if (torrentId !== this.torrentId) {
        this.filePath = filePath;
        this.torrentId = torrentId;
        this.setState({
          torrentId,
          isOpen: !!player,
          splitPath: filePath && filePath.split('/'),
        });
        if (torrentId) {
          this.startTorrenting();
        }
      } else if (filePath && filePath !== this.filePath) {
        this.filePath = filePath;
        this.setState({ splitPath: filePath && filePath.split('/') });
        this.openFile();
      }
    });
    localState
      .get('player')
      .get('paused')
      .on((p: boolean) => this.setPaused(p));
  }

  setPaused(paused: boolean) {
    const el = this.base as HTMLElement;
    const audio = el.querySelector('audio');
    if (audio) {
      paused ? audio.pause() : audio.play();
    }
  }

  onTorrent(torrent: any) {
    this.torrent = torrent;
    const img = torrent.files.find((f: any) => isImage(f));
    let poster = torrent.files.find(
      (f: any) => isImage(f) && (f.name.indexOf('cover') > -1 || f.name.indexOf('poster') > -1),
    );
    poster = poster || img;
    const el = this.base as HTMLElement;
    const cover = el.querySelector('.cover') as HTMLElement;
    cover.innerHTML = '';
    if (poster) {
      // Assuming poster.appendTo is appending the image element to the cover element
      cover.appendChild(poster.appendTo());
    }
    this.setState({ isOpen: true });
    this.openFile();
  }

  openFile() {
    if (this.torrent) {
      const file = this.torrent.files.find((f: any) => f.path === this.filePath);
      const el = this.base as HTMLElement;
      const player = el.querySelector('.player') as HTMLElement;
      player.innerHTML = '';
      if (file) {
        // Assuming file.appendTo is appending the media element to the player element
        player.appendChild(file.appendTo({ autoplay: true, muted: false }));
      }
      const audio = player.querySelector('audio');
      if (audio) {
        audio.onpause = audio.onplay = (e: Event) => {
          const target = e.target as HTMLAudioElement;
          localState.get('player').get('paused').put(!!target.paused);
        };
      }
    }
  }

  async startTorrenting() {
    const { default: AetherTorrent } = await import('aether-torrent');
    const client = new AetherTorrent();
    const existing = client.get(this.torrentId);
    if (existing) {
      this.onTorrent(existing);
    } else {
      client.add(this.torrentId, (_e: Error, t: any) => this.onTorrent(t));
    }
  }

  closeClicked() {
    this.setPaused(true);
    localState.get('player').put(null);
  }

  render() {
    const s = this.state;
    return (
      <>
        <div className="media-player" style={{ display: s.isOpen ? '' : 'none' }}>
          <div className="player"></div>
          <div className="cover"></div>
          <Link
            href={`/torrent/${encodeURIComponent(this.state.torrentId ?? '')}`}
            className="info"
          >
            {s.splitPath
              ? s.splitPath.map((str, i) => {
                  if (i === (s.splitPath?.length || 0) - 1) {
                    str = str.split('.').slice(0, -1).join('.');
                    return (
                      <p>
                        <b>{str}</b>
                      </p>
                    );
                  }
                  return <p>{str}</p>;
                })
              : ''}
          </Link>
          <div className="close" onClick={() => this.closeClicked()}>
            {Icons.close}
          </div>
        </div>
      </>
    );
  }
}

export default MediaPlayer;
