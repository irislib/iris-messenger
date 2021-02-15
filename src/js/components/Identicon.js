import { Component } from '../lib/preact.js';import { html } from '../Helpers.js';
import Helpers from '../Helpers.js';
import State from '../State.js';

class Identicon extends Component {
  constructor() {
    super();
    this.eventListeners = {};
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.str !== this.props.str) return true;
    if (nextState.name !== this.state.name) return true;
    if (nextState.activity !== this.state.activity) return true;
    return false;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.str !== this.props.str) {
      $(this.base).empty();
      this.componentDidMount();
    }
  }

  componentDidMount() {
    this.setState({activity: null});
    const i = Helpers.getIdenticon(this.props.str, this.props.width)[0];
    if (this.props.showTooltip) {
      State.public.user(this.props.str).get('profile').get('name').on((name,a,b,e) => {
        this.eventListeners['name'] = e;
        this.setState({name})
      });
    }
    this.base.appendChild(i);
    if (this.props.activity) {
      State.public.user(this.props.str).get('activity').on((activity, a, b, e) => {
        this.eventListeners['activity'] = e;
        if (activity) {
          if (activity.time && (new Date() - new Date(activity.time) < 15000)) {
            this.setState({activity: activity.status});
          }
        } else {
          this.setState({activity: null});
        }
      });
    }
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
    this.eventListeners = {};
  }

  render() {
    const activity = ['online', 'active'].indexOf(this.state.activity) > -1 ? this.state.activity : '';
    return html`
    <div onClick=${this.props.onClick} style="${this.props.onClick ? 'cursor: pointer;' : ''} position: relative;" class="identicon-container ${this.props.showTooltip ? 'tooltip' : ''} ${activity}">
      ${this.props.showTooltip && this.state.name ? html`<span class="tooltiptext">${this.state.name}</span>` : ''}
      ${this.props.activity ? html`<div class="online-indicator"/>` : ''}
    </div>
    `;
  }
}

export default Identicon;
