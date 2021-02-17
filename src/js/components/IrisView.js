import { Component } from '../lib/preact.js';
import Header from './Header.js';
import { html } from '../Helpers.js';

class IrisView extends Component {
  render() {
    return html`
      <${Header}/>
      <div class="main-view ${this.class || ''}" id=${this.id}>
        ${this.renderView()}
      </div>
    `;
  }
}

export default IrisView;
