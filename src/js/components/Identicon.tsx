import Component from '../BaseComponent';
import { html } from 'htm/preact';
import State from '../State';
import SafeImg from './SafeImg';
import iris from '../iris-lib';
import Identicon from 'identicon.js';

type Activity = {
  time: string;
  status: string;
}

type Props = {
  str: unknown;
  hidePhoto?: boolean;
  showTooltip?: boolean;
  activity?: string;
  onClick?: () => void;
  width: number;
};

type State = {
  photo: string | null;
  name: string | null;
  activity: string | null;
  identicon: string | null;
};

class MyIdenticon extends Component<Props, State> {
  activityTimeout?: ReturnType<typeof setTimeout>;

  updateIdenticon() {
    iris.util.getHash(this.props.str, `hex`)
      .then(hash => {
        const identicon = new Identicon(hash, {width: this.props.width, format: `svg`});
        this.setState({identicon: `data:image/svg+xml;base64,${identicon.toString()}`});
      });
  }

  componentDidMount() {
    const pub = this.props.str;
    if (!pub) { return; }

    this.updateIdenticon();

    if (!this.props.hidePhoto) {
      State.public.user(pub).get('profile').get('photo').on(this.inject()); // TODO: limit size
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
      <div onClick={this.props.onClick} style={{position: 'relative', width: `${width}px`, height: `${width}px`, cursor: this.props.onClick ? 'pointer' : undefined}} class={`identicon-container ${hasPhotoStyle} ${showTooltip} ${activity}`}>
        <div style={{width: width, height: width}} class="identicon">
          {hasPhoto ? <SafeImg src={this.state.photo} width={width}/> : <img width={width} src={this.state.identicon} />}
        </div>
        {this.props.showTooltip && this.state.name ? html`<span class="tooltiptext">${this.state.name}</span>` : ''}
        {this.props.activity ? <div class="online-indicator"/> : null}
      </div>
    );
  }
}

export default MyIdenticon;
