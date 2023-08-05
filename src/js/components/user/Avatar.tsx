import { sha256 } from '@noble/hashes/sha256';
import Identicon from 'identicon.js';

import Component from '../../BaseComponent';
import Key from '../../nostr/Key';
import { Unsubscribe } from '../../nostr/PubSub';
import SocialNetwork from '../../nostr/SocialNetwork';
import Show from '../helpers/Show';
import SafeImg from '../SafeImg';

type Props = {
  str: unknown;
  hidePicture?: boolean;
  showTooltip?: boolean;
  activity?: string;
  onClick?: () => void;
  width: number;
};

type State = {
  picture: string | null;
  name: string | null;
  activity: string | null;
  avatar: string | null;
  hasError: boolean;
};

class MyAvatar extends Component<Props, State> {
  activityTimeout?: ReturnType<typeof setTimeout>;
  unsub: Unsubscribe | undefined;

  updateAvatar() {
    const hash = sha256(this.props.str as string);
    // convert to hex
    const hex = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const identicon = new Identicon(hex, {
      width: this.props.width,
      format: `svg`,
    });
    this.setState({
      avatar: `data:image/svg+xml;base64,${identicon.toString()}`,
    });
  }

  componentDidMount() {
    const pub = this.props.str as string;
    if (!pub) {
      return;
    }

    this.updateAvatar();

    const nostrAddr = Key.toNostrHexAddress(pub);
    if (nostrAddr) {
      this.unsub = SocialNetwork.getProfile(nostrAddr, (profile) => {
        profile &&
          this.setState({
            // TODO why profile undefined sometimes?
            picture: profile.picture,
            name: profile.name,
          });
      });
    }

    this.setState({ activity: null });
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    if (this.activityTimeout !== undefined) {
      clearTimeout(this.activityTimeout);
    }
    this.unsub?.();
  }

  render() {
    const width = this.props.width;
    const activity =
      ['online', 'active'].indexOf(this.state.activity ?? '') > -1 ? this.state.activity : '';
    const hasPicture =
      this.state.picture &&
      !this.state.hasError &&
      !this.props.hidePicture &&
      !SocialNetwork.isBlocked(this.props.str as string);
    const hasPictureStyle = hasPicture ? 'has-picture' : '';
    const showTooltip = this.props.showTooltip ? 'tooltip' : '';

    return (
      <div
        style={{
          maxWidth: `${width}px`,
          maxHeight: `${width}px`,
          cursor: this.props.onClick ? 'pointer' : undefined,
        }}
        className={`inline-flex flex-col flex-shrink-0 items-center justify-center relative select-none ${hasPictureStyle} ${showTooltip} ${activity}`}
        onClick={this.props.onClick}
      >
        <div>
          <Show when={hasPicture}>
            <SafeImg
              className="object-cover rounded-full"
              src={this.state.picture as string}
              width={width}
              square={true}
              onError={() => this.setState({ hasError: true })}
            />
          </Show>
          <Show when={!hasPicture}>
            <img width={width} className="max-w-full rounded-full" src={this.state.avatar || ''} />
          </Show>
        </div>
        <Show when={this.props.showTooltip && this.state.name}>
          <span className="tooltiptext">{this.state.name}</span>
        </Show>
      </div>
    );
  }
}

export default MyAvatar;
