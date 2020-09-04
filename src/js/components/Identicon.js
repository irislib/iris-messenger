import { Component } from '../lib/preact.js';import { html } from '../Helpers.js';
import Helpers from '../Helpers.js';

class Identicon extends Component {
  shouldComponentUpdate() {
    return false;
  }

  componentDidMount() {
    const i = Helpers.getIdenticon(this.props.str, this.props.width)[0];
    this.base.appendChild(i);
  }

  render() {
    return html`<div class="identicon-container"/>`;
  }
}

export default Identicon;
