import { sha256 } from '@noble/hashes/sha256';
import Identicon from 'identicon.js';

import Component from '../../BaseComponent';
import Key from '../../nostr/Key';
import { Unsubscribe } from '../../nostr/PubSub';
import SocialNetwork from '../../nostr/SocialNetwork';
import Show from '../helpers/Show';
import SafeImg from '../SafeImg';
import profileManager from '../../dwotr/ProfileManager';
import { ID } from '../../nostr/UserIds';
import ProfileRecord from '../../dwotr/model/ProfileRecord';
import { TrustScoreEvent } from '../../dwotr/GraphNetwork';

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
  handleEvent: any;


  componentDidMount() {
    const pub = this.props.str as string;
    if (!pub) {
      return;
    }

    let id = ID(pub);

    this.handleEvent = (e: any) => {
      let p = e.detail as ProfileRecord;
      //if (!p || p.created_at <= profile.created_at) return;
      this.setState({
        picture: p.picture,
        name: p.name,
      });
    };
  

    let eventID = TrustScoreEvent.getEventId(id);
    window.addEventListener(eventID, this.handleEvent);

    let profile = profileManager.getCurrentProfile(id);
    this.setState({
      picture: profile.picture,
      name: profile.name,
      avatar: profileManager.createImageUrl(pub, this.props.width),
    });

    profileManager.subscribe(pub);

    this.setState({ activity: null });
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    if (this.activityTimeout !== undefined) {
      clearTimeout(this.activityTimeout);
    }
    const pub = this.props.str as string;
    if (!pub) {
      return;
    }

    let id = ID(pub);
    let eventID = TrustScoreEvent.getEventId(id);
    window.removeEventListener(eventID, this.handleEvent);
    //this.unsub?.();
    profileManager.unsubscribe(this.props.str as string);
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
