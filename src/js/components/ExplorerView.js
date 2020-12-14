import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import { route } from '../lib/preact-router.es.js';
import {publicState} from '../Main.js';
import Session from '../Session.js';

const chevronDown = html`
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
</svg>
`;

const chevronRight = html`
<svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
</svg>
`;

class ExplorerView extends Component {
  render() {
    return html`
      <div class="main-view">
        <p>Users ${chevronRight} ${this.props.user || Session.getPubKey()}</p>
        <${ExplorerNode} user=${this.props.user} path=''/>
      </div>
    `;
  }
}

class ExplorerNode extends Component {
  constructor() {
    super();
    this.eventListeners = {};
    this.state = {children: {}, isChildOpen: {}};
    this.children = {};
    this.isChildOpen = {};
  }

  getNode() {
    if (this.props.path) {
      const path = this.props.path.split('/');
      return path.reduce((sum, current) => (current && sum.get(current)) || sum, publicState);
    }
    return publicState.user(this.props.user);
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
    this.eventListeners = {};
  }

  componentDidMount() {
    this.getNode().map().on((v, k) => {
      this.children[k] = v;
      this.setState({children: this.children});
    });
  }

  onChildObjectClick(e, k) {
    e.preventDefault();
    this.isChildOpen[k] = !this.isChildOpen[k];
    this.setState({isChildOpen: this.isChildOpen});
  }

  renderChildObject(k, v) {
    const path = v['_']['#'];
    return html`
      <div class="explorer-dir">
        ${this.state.isChildOpen[k] ? chevronDown : chevronRight}
        <a href="#" onClick=${e => this.onChildObjectClick(e, k)}><b>${k}</b></a>
        ${this.state.isChildOpen[k] ? html`<${ExplorerNode} path=${path}/>` : ''}
      </div>
    `;
  }

  renderChild(k, v) {
    const s = JSON.stringify(v);
    return html`
      <div class="explorer-dir">
        <b>${k}</b>: ${s}
      </div>
    `;
  }

  render() {
    return html`
      <div class="explorer-dir">
        ${Object.keys(this.state.children).sort().map(k => {
          const v = this.state.children[k];
          if (typeof v === 'object' && v && v['_']) {
            return this.renderChildObject(k, v);
          } else {
            return this.renderChild(k, v);
          }
        })}
      </div>
    `;
  }
}

export default ExplorerView;
