import Component from '../../BaseComponent';
import { Unsubscribe } from '../../nostr/PubSub';
import SocialNetwork from '../../nostr/SocialNetwork';
import Show from '../helpers/Show';
import SafeImg from '../SafeImg';
import profileManager from '../../dwotr/ProfileManager';
import { ID } from '../../nostr/UserIds';
import ProfileRecord, { ProfileMemory } from '../../dwotr/model/ProfileRecord';
import { ProfileEvent } from '../../dwotr/network/ProfileEvent';

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
  created_at: number;
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
      let p = e.detail as ProfileMemory;
      let created_at = this.state.created_at || 0;
      if (!p || p.id != id || p.created_at <= created_at) return;
      this.setState({
        picture: p.picture,
        name: p.name,
        created_at: p.created_at,
      });
    };
  

    ProfileEvent.add(this.handleEvent);

    let profile = profileManager.getMemoryProfile(id);

    this.setState({
      picture: profile.picture,
      name: profile.name,
      avatar: profileManager.createImageUrl(pub, this.props.width),
    });

    this.unsub = profileManager.subscribe(pub);

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

    ProfileEvent.remove(this.handleEvent);
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
