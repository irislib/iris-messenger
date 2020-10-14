import { Component } from '../lib/preact.js';import { html } from '../Helpers.js';
import Helpers from '../Helpers.js';
import {publicState} from '../Main.js';

class Identicon extends Component {
  constructor() {
    super();
    this.eventListeners = {};
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.str !== this.props.str) return true;
    if (nextState.name !== this.state.name) return true;
    return false;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.str !== this.props.str) {
      $(this.base).empty();
      this.componentDidMount();
    }
  }

  componentDidMount() {
    const i = Helpers.getIdenticon(this.props.str, this.props.width)[0];
    if (this.props.showTooltip) {
      publicState.user(this.props.str).get('profile').get('name').on((name,a,b,e) => {
        this.eventListeners['name'] = e;
        this.setState({name})
      });
    }
    this.base.appendChild(i);
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
    this.eventListeners = {};
  }

  render() {
    return html`
    <div onClick=${this.props.onClick} style=${this.props.onClick ? 'cursor: pointer;' : ''} class="identicon-container ${this.props.showTooltip ? 'tooltip' : ''}">
      ${this.props.showTooltip && this.state.name ? html`<span class="tooltiptext">${this.state.name}</span>` : ''}
    </div>`;
  }
}

export default Identicon;
