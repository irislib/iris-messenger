import { sha256 } from '@noble/hashes/sha256';
import Identicon from 'identicon.js';
import styled from 'styled-components';

import Component from '../BaseComponent';
import Key from '../nostr/Key';
import { Unsubscribe } from '../nostr/PubSub';
import SocialNetwork from '../nostr/SocialNetwork';

import SafeImg from './SafeImg';

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
  identicon: string | null;
  hasError: boolean;
};

const IdenticonContainer = styled.div`
  max-width: ${(props: Props) => props.width}px;
  max-height: ${(props: Props) => props.width}px;
  display: inline-block;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  position: relative;
  user-select: none;
`;

class MyIdenticon extends Component<Props, State> {
  activityTimeout?: ReturnType<typeof setTimeout>;
  unsub: Unsubscribe | undefined;

  updateIdenticon() {
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
      identicon: `data:image/svg+xml;base64,${identicon.toString()}`,
    });
  }

  componentDidMount() {
    const pub = this.props.str as string;
    if (!pub) {
      return;
    }

    this.updateIdenticon();

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
      !SocialNetwork.blockedUsers.has(this.props.str as string);
    const hasPictureStyle = hasPicture ? 'has-picture' : '';
    const showTooltip = this.props.showTooltip ? 'tooltip' : '';

    return (
      <IdenticonContainer
        width={width}
        onClick={this.props.onClick}
        style={{ cursor: this.props.onClick ? 'pointer' : undefined }}
        className={`${hasPictureStyle} ${showTooltip} ${activity}`}
      >
        <div>
          {hasPicture ? (
            <SafeImg
              className="rounded-full"
              src={this.state.picture as string}
              width={width}
              square={true}
              style={{ objectFit: 'cover' }}
              onError={() => this.setState({ hasError: true })}
            />
          ) : (
            <img width={width} style="max-width:100%; border-radius: 50%" src={this.state.identicon || ''} />
          )}
        </div>
        {this.props.showTooltip && this.state.name ? (
          <span class="tooltiptext">{this.state.name}</span>
        ) : (
          ''
        )}
      </IdenticonContainer>
    );
  }
}

export default MyIdenticon;
