import Component from '../BaseComponent';
import { html } from 'htm/preact';
import State from '../State.js';
import SafeImg from './SafeImg.js';
import iris from 'iris-lib';
import $ from 'jquery';

class Identicon extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.str !== this.props.str) return true;
    if (nextProps.hidePhoto !== this.props.hidePhoto) return true;
    if (nextState.photo !== this.state.photo) return true;
    if (nextState.name !== this.state.name) return true;
    if (nextState.activity !== this.state.activity) return true;
    return false;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.str !== this.props.str) {
      $(this.base).empty();
      this.componentDidMount();
    }
    if (prevProps.hidePhoto !== this.props.hidePhoto) {
      $(this.identicon).toggle(!this.state.photo || this.props.hidePhoto);
    }
  }

  componentDidMount() {
    const pub = this.props.str;
    if (!pub) { return; }
    this.identicon = new iris.Attribute({type: 'keyID', value: pub}).identicon({width: this.props.width, showType: false});
    this.base.appendChild(this.identicon);
    if (!this.props.hidePhoto) {
      State.public.user(pub).get('profile').get('photo').on(this.inject()); // TODO: limit size
    } else {
      $(this.identicon).show();
    }

    this.setState({activity: null});
    if (this.props.showTooltip) {
      State.public.user(this.props.str).get('profile').get('name').on(this.inject());
    }
    if (this.props.activity) {
      State.public.user(this.props.str).get('activity').on(this.sub(
        activity => {
          if (activity) {
            if (activity.time && (new Date() - new Date(activity.time) < 30000)) {
              clearTimeout(this.activityTimeout);
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
    clearTimeout(this.activityTimeout);
  }

  render() {
    const width = this.props.width;
    const activity = ['online', 'active'].indexOf(this.state.activity) > -1 ? this.state.activity : '';
    const hasPhoto = this.state.photo && !this.props.hidePhoto ? 'has-photo' : '';
    const showTooltip = this.props.showTooltip ? 'tooltip' : '';
    return html`
      <div onClick=${this.props.onClick} style="${this.props.onClick ? 'cursor: pointer;' : ''} position: relative;" class="identicon-container ${hasPhoto} ${showTooltip} ${activity}">
        <div style="width: ${width}; height: ${width}" class="identicon">
          ${(this.state.photo && !this.props.hidePhoto) ? html`<${SafeImg} src=${this.state.photo} class="identicon-image" width=${width}/>` : ''}
        </div>
        ${this.props.showTooltip && this.state.name ? html`<span class="tooltiptext">${this.state.name}</span>` : ''}
        ${this.props.activity ? html`<div class="online-indicator"/>` : ''}
      </div>
    `;
  }
}

export default Identicon;
