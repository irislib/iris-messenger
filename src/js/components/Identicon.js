import { Component } from '../lib/preact.js';import { html } from '../Helpers.js';
import Helpers from '../Helpers.js';

class Identicon extends Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.str !== this.props.str;
  }

  componentDidUpdate() {
    $(this.base).empty();
    this.componentDidMount();
  }

  componentDidMount() {
    const i = Helpers.getIdenticon(this.props.str, this.props.width)[0];
    this.base.appendChild(i);
  }

  render() {
    return html`<div onClick=${this.props.onClick} style=${this.props.onClick ? 'cursor: pointer;' : ''} class="identicon-container"/>`;
  }
}

export default Identicon;
