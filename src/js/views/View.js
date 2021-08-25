import Component from '../BaseComponent.js';
import { createRef } from 'preact';
import Header from '../components/Header.js';
import { html } from 'htm/preact';

class View extends Component {
  scrollElement = createRef();

  render() {
    return html`
      <${this.props.header || Header}/>
      <div ref=${this.scrollElement} class="main-view ${this.class || ''}" id=${this.id}>
        ${this.renderView()}
      </div>
    `;
  }
}

export default View;
