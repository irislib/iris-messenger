import { Helmet } from "react-helmet";
import { createRef } from "preact";

import Component from "../BaseComponent";
import Helpers from "../Helpers";
import Icons from "../Icons";
import localState from "../LocalState";
import { translate as t } from "../translations/Translation.mjs";

const isOfType = (f, types) => types.indexOf(f.name.slice(-4)) !== -1;
const isVideo = (f) => isOfType(f, ["webm", ".mp4", ".ogg"]);
const isAudio = (f) => isOfType(f, [".mp3", ".wav", ".m4a"]);
const isImage = (f) => isOfType(f, [".jpg", "jpeg", ".gif", ".png"]);

class Torrent extends Component {
  coverRef = createRef();
  state = {
    settings: {} as any,
    player: {} as any,
    activeFilePath: "",
    torrent: {} as any,
    isAudioOpen: false,
    showFiles: false,
    torrenting: false,
    hasNext: false,
    splitPath: null as any,
    ogImageUrl: "",
  };
  player: any;
  torrent: any;
  observer: any;

  componentDidMount() {
    console.log("componentDidMount torrent");
    localState.get("player").on(
      this.sub((player) => {
        this.player = player;
        this.setState({ player });
        if (
          this.torrent &&
          this.player &&
          this.player.filePath !== this.state.activeFilePath
        ) {
          const file = this.getActiveFile(this.torrent);
          file && this.openFile(file);
        }
      })
    );
    const showFiles = this.props.showFiles;
    showFiles && this.setState({ showFiles });
    localState.get("settings").on(this.inject());
    (async () => {
      if (
        this.props.standalone ||
        (await localState.get("settings").get("enableWebtorrent").once())
      ) {
        this.startTorrenting();
      }
    })();
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.observer && this.observer.disconnect();
    delete this.observer;
  }

  onPlay(e) {
    if (!e.target.muted) {
      localState.get("player").get("paused").put(true);
    }
  }

  async startTorrenting(clicked?: boolean) {
    this.setState({ torrenting: true });
    const torrentId = this.props.torrentId;
    const { default: AetherTorrent } = await import("aether-torrent");
    const client = new AetherTorrent();
    const existing = client.get(torrentId);
    if (existing) {
      this.onTorrent(existing, clicked);
    } else {
      client.add(
        torrentId,
        (err, t) => t && !err && this.onTorrent(t, clicked)
      );
    }
  }

  playAudio(filePath, e?) {
    e && e.preventDefault();
    localState
      .get("player")
      .put({ torrentId: this.props.torrentId, filePath, paused: false });
  }

  pauseAudio(e) {
    e && e.preventDefault();
    localState.get("player").put({ paused: true });
  }

  openFile(file, clicked?: boolean) {
    const base = this.base as Element;
    const isVid = isVideo(file);
    const isAud = !isVid && isAudio(file);
    if (this.state.activeFilePath === file.path) {
      if (isVid) {
        const el = base.querySelector("video");
        el && el.play();
      } else if (isAud) {
        localState.get("player").get("paused").put(false);
      }
      return;
    }

    let splitPath;
    if (!isVid) {
      splitPath = file.path.split("/");
    }
    this.setState({ activeFilePath: file.path, splitPath, isAudioOpen: isAud });
    let autoplay, muted;
    if (clicked) {
      autoplay = true;
      muted = false;
    } else {
      autoplay = isVid && this.state.settings.autoplayVideos;
      muted = autoplay;
    }
    const el = base?.querySelector(".player");
    el && (el.innerHTML = "");
    if (isAud && clicked) {
      this.playAudio(file.path);
    }
    if (!isAud) {
      file.appendTo(el, { autoplay, muted });
    }
    if (isVid && this.props.autopause) {
      const vid = base.querySelector("video");
      const handlePlay = (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            autoplay && vid?.play();
          } else {
            vid?.pause();
          }
        });
      };
      const options = {
        rootMargin: "0px",
        threshold: [0.25, 0.75],
      };
      this.observer = new IntersectionObserver(handlePlay, options);
      this.observer.observe(vid);
    }

    const info = base.querySelector(".info") as HTMLElement;
    info && (info.style.display = !isVid ? "block" : "none");
    const player = base.querySelector("video, audio") as HTMLMediaElement;
    if (player) {
      player.addEventListener("ended", () => {
        const typeCheck = player.tagName === "VIDEO" ? isVideo : isAudio;
        this.openNextFile(typeCheck);
      });
      player.onplay = player.onvolumechange = this.onPlay;
    }
  }

  getNextIndex(typeCheck) {
    const files = this.state.torrent.files;
    const currentIndex = files.findIndex(
      (f) => f.path === this.state.activeFilePath
    );
    let nextIndex = files.findIndex((f, i) => i > currentIndex && typeCheck(f));
    if (nextIndex === -1) {
      nextIndex = files.findIndex((f) => typeCheck(f));
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
      file = torrent.files.find((f) => {
        return f.path === p.filePath;
      });
    }
    return file;
  }

  onTorrent(torrent, clicked) {
    console.log("onTorrent", this.props.torrentId, torrent);
    if (!this.coverRef.current) {
      return;
    }
    this.torrent = torrent;
    const interval = setInterval(() => {
      if (!torrent.files) {
        console.log("no files found in torrent:", torrent);
        return;
      }
      clearInterval(interval);
      const video = torrent.files.find((f) => isVideo(f));
      const audio = torrent.files.find((f) => isAudio(f));
      const img = torrent.files.find((f) => isImage(f));

      const file =
        this.getActiveFile(torrent) ||
        video ||
        audio ||
        img ||
        torrent.files[0];
      this.setState({ torrent, cover: img });
      file && this.openFile(file, clicked);

      let poster = torrent.files.find(
        (f) =>
          isImage(f) &&
          (f.name.indexOf("cover") > -1 || f.name.indexOf("poster") > -1)
      );
      poster = poster || img;
      if (poster) {
        poster.appendTo(this.coverRef.current);
      }
    }, 1000);
  }

  showFilesClicked(e) {
    e.preventDefault();
    this.setState({ showFiles: !this.state.showFiles });
  }

  openTorrentClicked(e) {
    e.preventDefault();
    this.startTorrenting(true);
  }

  renderLoadingTorrent() {
    const s = this.state;
    const to = s.torrent;
    const p = s.player;
    const playing = p && p.torrentId === this.props.torrentId && !p.paused;
    let playButton = "" as any;
    if (s.isAudioOpen) {
      playButton = playing ? (
        <a href="#" onClick={(e) => this.pauseAudio(e)}>
          {Icons.pause}
        </a>
      ) : (
        <a href="#" onClick={(e) => this.playAudio(s.activeFilePath, e)}>
          {Icons.play}
        </a>
      );
    }
    // TODO break into smaller components
    return (
      <>
        {s.torrenting && !s.torrent ? <p>Loading attachment...</p> : null}
        <div
          className="cover"
          ref={this.coverRef}
          style={s.isAudioOpen ? {} : { display: "none" }}
        />
        <div className="info">
          {s.splitPath
            ? s.splitPath.map((str, i) => {
                if (i === s.splitPath.length - 1) {
                  if (s.isAudioOpen) {
                    str = str.split(".").slice(0, -1).join(".");
                  }
                  return (
                    <p>
                      <b>{str}</b>
                    </p>
                  );
                }
                return <p>{str}</p>;
              })
            : null}
        </div>
        {s.hasNext ? <b>prev</b> : null}
        <div className="player">{playButton}</div>
        {s.hasNext ? <b>next</b> : null}
        {this.props.standalone || this.props.preview ? (
          <>
            <a href={this.props.torrentId}>Magnet link</a>
            {to && to.files ? (
              <a
                href=""
                style={{ marginLeft: "30px" }}
                onClick={(e) => this.showFilesClicked(e)}
              >
                {t(s.showFiles ? "hide_files" : "show_files")}
              </a>
            ) : null}
          </>
        ) : (
          <a href={`/torrent/${encodeURIComponent(this.props.torrentId)}`}>
            {t("show_files")}
          </a>
        )}
        {s.showFiles && to && to.files ? (
          <>
            <p>
              {t("peers")}: {to.numPeers}
            </p>
            <div className="flex-table details">
              {to.files.map((f) => (
                <div
                  key={f.path}
                  onClick={() => this.openFile(f, true)}
                  className={`flex-row ${
                    s.activeFilePath === f.path ? "active" : ""
                  }`}
                >
                  <div className="flex-cell">{f.name}</div>
                  <div className="flex-cell no-flex">
                    {Helpers.formatBytes(f.length)}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </>
    );
  }

  renderMeta() {
    const s = this.state;
    const title =
      (s.splitPath &&
        s.splitPath[s.splitPath.length - 1]
          .split(".")
          .slice(0, -1)
          .join(".")) ||
      "File sharing";
    const ogTitle = `${title} | Iris`;
    const description = "Shared files";
    const ogType = s.isAudioOpen ? "music:song" : "video.movie";
    return (
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:type" content={ogType} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={description} />
        {s.ogImageUrl ? (
          <meta property="og:image" content={s.ogImageUrl} />
        ) : null}
      </Helmet>
    );
  }

  render() {
    return (
      <div className="torrent">
        {this.props.standalone ? this.renderMeta() : null}
        {!this.state.settings.enableWebtorrent &&
        !this.state.settings.torrenting &&
        !this.props.standalone ? (
          <a href="" onClick={(e) => this.openTorrentClicked(e)}>
            {t("show_attachment")}
          </a>
        ) : (
          this.renderLoadingTorrent()
        )}
      </div>
    );
  }
}

export default Torrent;
