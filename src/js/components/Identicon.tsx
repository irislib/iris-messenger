import Identicon from 'identicon.js';
import iris from 'iris-lib';
import styled from 'styled-components';

import Component from '../BaseComponent';
import Nostr from '../Nostr';

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

  updateIdenticon() {
    iris.util.getHash(this.props.str as string, `hex`).then((hash) => {
      const identicon = new Identicon(hash, {
        width: this.props.width,
        format: `svg`,
      });
      this.setState({
        identicon: `data:image/svg+xml;base64,${identicon.toString()}`,
      });
    });
  }

  componentDidMount() {
    const pub = this.props.str as string;
    if (!pub) {
      return;
    }

    this.updateIdenticon();

    const nostrAddr = Nostr.toNostrHexAddress(pub);
    if (nostrAddr) {
      Nostr.getProfile(nostrAddr, (profile) => {
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
  }

  render() {
    const width = this.props.width;
    const activity =
      ['online', 'active'].indexOf(this.state.activity ?? '') > -1 ? this.state.activity : '';
    const hasPicture = this.state.picture && !this.props.hidePicture && !Nostr.blockedUsers.has(this.props.str as string);
    const hasPictureStyle = hasPicture ? 'has-picture' : '';
    const showTooltip = this.props.showTooltip ? 'tooltip' : '';

    const pictureElement = <SafeImg src={this.state.picture} width={width} />;

    return (
      <IdenticonContainer
        width={width}
        onClick={this.props.onClick}
        style={{ cursor: this.props.onClick ? 'pointer' : undefined }}
        className={`identicon-container ${hasPictureStyle} ${showTooltip} ${activity}`}
      >
        <div style={{ width: width, height: width }} class="identicon">
          {hasPicture ? pictureElement : <img width={width} src={this.state.identicon} />}
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
