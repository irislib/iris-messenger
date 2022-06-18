import Component from '../BaseComponent';
import { createRef } from 'preact';
import Header from '../components/Header';
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
