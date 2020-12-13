import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import { route } from '../lib/preact-router.es.js';
import {publicState} from '../Main.js';
import Session from '../Session.js';

class ExplorerView extends Component {
  render() {
    return html`
      <div class="main-view public-messages-view">
        <div class="centered-container">
          User space of ${this.props.user || Session.getPubKey()}:
          <${ExplorerNode} user=${this.props.user} path=''/>
        </div>
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
      <li>
        <a href="#" onClick=${e => this.onChildObjectClick(e, k)}><b>${k}</b></a>
        ${this.state.isChildOpen[k] ? html`<${ExplorerNode} path=${path}/>` : ''}
      </li>
    `;
  }

  renderChild(k, v) {
    const s = JSON.stringify(v);
    return html`
      <li>
        <b>${k}</b>: ${s}
      </li>
    `;
  }

  render() {
    return html`
      <ul>
        ${Object.keys(this.state.children).sort().map(k => {
          const v = this.state.children[k];
          if (typeof v === 'object' && v && v['_']) {
            return this.renderChildObject(k, v);
          } else {
            return this.renderChild(k, v);
          }
        })}
      </ul>
    `;
  }
}

export default ExplorerView;
