import Component from '../BaseComponent';
import { html } from 'htm/preact';
import State from '../State';
import SafeImg from './SafeImg';
import iris from '../iris-lib';
import $ from 'jquery';

type Activity = {
  time: string;
  status: string;
}

type Props = {
  str: unknown;
  hidePhoto: boolean;
  showTooltip: boolean;
  activity: string;
  onClick?: () => void;
  width: number;
};

type State = {
  photo: string | null;
  name: string | null;
  activity: string | null;
};

class Identicon extends Component<Props, State> {
  identicon?: HTMLElement;
  base?: HTMLElement;
  activityTimeout?: ReturnType<typeof setTimeout>;

  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    return nextProps.str !== this.props.str
      || nextProps.hidePhoto !== this.props.hidePhoto
      || nextState.photo !== this.state.photo
      || nextState.name !== this.state.name
      || nextState.activity !== this.state.activity
  }

  componentDidUpdate(prevProps: Props): void {
    if (prevProps.str !== this.props.str && this.base !== undefined) {
      $(this.base).empty();
      this.componentDidMount();
    }
    if (prevProps.hidePhoto !== this.props.hidePhoto && this.identicon !== undefined) {
      $(this.identicon).toggle(!this.state.photo || this.props.hidePhoto);
    }
  }

  componentDidMount() {
    const pub = this.props.str;
    if (!pub) { return; }
    this.identicon = new iris.Attribute({type: 'keyID', value: pub}).identicon({width: this.props.width, showType: false});
    if (this.base !== undefined && this.identicon !== undefined) {
      this.base.appendChild(this.identicon);
    }
    if (!this.props.hidePhoto) {
      State.public.user(pub).get('profile').get('photo').on(this.inject()); // TODO: limit size
    } else if (this.identicon !== undefined) {
      $(this.identicon).show();
    }

    this.setState({activity: null});
    if (this.props.showTooltip) {
      State.public.user(this.props.str).get('profile').get('name').on(this.inject());
    }
    if (this.props.activity) {
      State.public.user(this.props.str).get('activity').on(this.sub(
        (activity?: Activity) => {
          if (activity) {
            if (activity.time && ((new Date()).getTime() - (new Date(activity.time)).getTime() < 30000)) {
              if (this.activityTimeout !== undefined) {
                clearTimeout(this.activityTimeout);
              }
              this.activityTimeout = setTimeout(() => this.setState({activity:null}), 30000);
              this.setState({activity: activity.status});
            }
          } else {
            this.setState({activity: null});
          }
        }
      ));
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    if (this.activityTimeout !== undefined) {
      clearTimeout(this.activityTimeout);
    }
  }

  render() {
    const width = this.props.width;
    const activity = ['online', 'active'].indexOf(this.state.activity ?? '') > -1 ? this.state.activity : '';
    const hasPhoto = this.state.photo && !this.props.hidePhoto && this.state.photo.indexOf('data:image') === 0;
    const hasPhotoStyle = hasPhoto ? 'has-photo' : '';
    const showTooltip = this.props.showTooltip ? 'tooltip' : '';
    return (
      <div onClick={this.props.onClick} style={{position: 'relative', cursor: this.props.onClick ? 'pointer' : undefined}} class={`identicon-container ${hasPhotoStyle} ${showTooltip} ${activity}`}>
        <div style={{width: width, height: width}} class="identicon">
          {hasPhoto ? <SafeImg src={this.state.photo} class="identicon-image" width={width}/> : null}
        </div>
        {this.props.showTooltip && this.state.name ? html`<span class="tooltiptext">${this.state.name}</span>` : ''}
        {this.props.activity ? <div class="online-indicator"/> : null}
      </div>
    );
  }
}

export default Identicon;
