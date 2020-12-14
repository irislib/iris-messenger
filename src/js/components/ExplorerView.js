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
    const split = (this.props.node || '').split('/');
    const pathString = split.map((k, i) => html`
      ${chevronRight} <a href="#/explorer/${encodeURIComponent(split.slice(0,i+1).join('/'))}">${k}</a>
    `);
    return html`
      <div class="main-view">
        <p>
          <a href="#/explorer">Public</a> ${this.props.node ? pathString : ''}
        </p>
        ${this.props.node ? html`
          <${ExplorerNode} showTools=${true} path=${this.props.node}/>
        ` : html`
          <div class="explorer-dir">
            ${chevronDown} Users
            <div class="explorer-dir">
              ${chevronDown} <a href="#/explorer/~${Session.getPubKey()}">${Session.getPubKey()}</a>
              <${ExplorerNode} path='~${Session.getPubKey()}'/>
            </div>
          </div>
          <div class="explorer-dir">
            ${chevronRight} <a href="#/explorer/%23">#</a>
          </div>
        `}

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
    return publicState;
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
    this.eventListeners = {};
  }

  componentDidUpdate(prevProps) {
    if (prevProps.node !== this.props.node) {
      this.componentWillUnmount();
    }
  }

  componentDidMount() {
    this.getNode().map().on((v, k, c, e) => {
      this.eventListeners['n'] = e;
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
        <span onClick=${e => this.onChildObjectClick(e, k)}>${this.state.isChildOpen[k] ? chevronDown : chevronRight}</span>
        <a href="#/explorer/${encodeURIComponent(path)}"><b>${k}</b></a>
        ${this.state.isChildOpen[k] ? html`<${ExplorerNode} path=${path}/>` : ''}
      </div>
    `;
  }

  renderChildValue(k, v) {
    const s = JSON.stringify(v);
    return html`
      <div class="explorer-dir">
        <b>${k}</b>: ${s}
      </div>
    `;
  }

  onExpandClicked() {
    const expandAll = !this.state.expandAll;
    Object.keys(this.children).forEach(k => {
      this.isChildOpen[k] = expandAll;
    });
    this.setState({expandAll, isChildOpen: this.isChildOpen});
  }

  onNewItemSubmit(e) {
    if (this.state.newItemName) {
      this.getNode().get(this.state.newItemName.trim()).put(this.state.showNewItem === 'object' ? {a:null} : '');
      this.setState({showNewItem: false, newItemName: ''});
    }
  }

  onNewItemNameInput(e) {
    this.setState({newItemName: e.target.value.trimStart().replace('  ', ' ')});
  }

  render() {
    return html`
      <div class="explorer-dir">
        ${this.props.showTools ? html`
          <p class="explorer-tools">
            <a onClick=${() => this.onExpandClicked()}>${this.state.expandAll ? 'Close all' : 'Expand all'}</a>
            <a onClick=${() => this.setState({showNewItem:'object'})}>New object</a>
            <a onClick=${() => this.setState({showNewItem:'value'})}>New value</a>
          </p>
        `: ''}
        ${this.state.showNewItem ? html`
          <p>
            <form onSubmit=${e => this.onNewItemSubmit()}>
              <input type="text" onInput=${e => this.onNewItemNameInput(e)} value=${this.state.newItemName} placeholder="New ${this.state.showNewItem} name"/>
              <button type="submit">Create</button>
              <button onClick=${() => this.setState({showNewItem: false})}>Cancel</button>
            </form>
          </p>
        ` : ''}
        ${Object.keys(this.state.children).sort().map(k => {
          const v = this.state.children[k];
          if (typeof v === 'object' && v && v['_']) {
            return this.renderChildObject(k, v);
          } else {
            return this.renderChildValue(k, v);
          }
        })}
      </div>
    `;
  }
}

export default ExplorerView;
