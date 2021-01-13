import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import State from '../State.js';
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
      ${chevronRight} <a href="#/explorer/${encodeURIComponent(split.slice(0,i+1).join('/'))}">${decodeURIComponent(k)}</a>
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
              ${chevronDown} <a href="#/explorer/~${encodeURIComponent(Session.getPubKey())}">${Session.getPubKey()}</a>
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
    this.state = {children: {}};
    this.children = {};
  }

  getNode() {
    if (this.props.path) {
      const path = this.props.path.split('/');
      return path.reduce((sum, current) => (current && sum.get(decodeURIComponent(current))) || sum, State.public);
    }
    return State.public;
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
    this.eventListeners = {};
  }

  componentDidUpdate(prevProps) {
    if (prevProps.path !== this.props.path) {
      this.componentWillUnmount();
    }
  }

  componentDidMount() {
    this.isMine = this.props.path.indexOf('~' + Session.getPubKey()) === 0;
    this.getNode().map().on(async (v, k, c, e) => {
      let encryption;
      if (typeof v === 'string' && v.indexOf('SEA{') === 0) {
        try {
          const myKey = Session.getKey();
          let dec = await Gun.SEA.decrypt(v, myKey);
          if (dec === undefined) {
            if (!this.mySecret) {
              this.mySecret = await Gun.SEA.secret(myKey.epub, myKey);
              dec = await Gun.SEA.decrypt(v, this.mySecret);
            }
          }
          if (dec !== undefined) {
            v = dec;
            encryption = 'Decrypted';
          } else {
            encryption = 'Encrypted';
          }
        } catch(e) {
          null;
        }
      }
      this.eventListeners['n'] = e;
      const prev = this.children[k] || {};
      this.children[k] = Object.assign(prev, { value: v, encryption });
      this.setState({children: this.children});
    });
  }

  onChildObjectClick(e, k) {
    e.preventDefault();
    this.children[k].open = !this.children[k].open;
    this.setState({children: this.children});
  }

  renderChildObject(k) {
    const path = this.props.path + '/' + encodeURIComponent(k);
    return html`
      <div class="explorer-dir">
        <span onClick=${e => this.onChildObjectClick(e, k)}>${this.state.children[k].open ? chevronDown : chevronRight}</span>
        <a href="#/explorer/${encodeURIComponent(path)}"><b>${k}</b></a>
        ${this.state.children[k].open ? html`<${ExplorerNode} path=${path}/>` : ''}
      </div>
    `;
  }

  renderChildValue(k, v) {
    let s;
    const encryption = this.children[k].encryption;
    const decrypted = encryption === 'Decrypted';
    if (encryption) {
      if (!decrypted) {
        s = html`<i>Encrypted value</i>`;
      } else {
        s = JSON.stringify(v);
      }
    } else {
      const pub = Session.getPubKey();
      const isMine = this.props.path.indexOf('~' + pub) === 0;
      const path = isMine && (this.props.path + '/' + k).replace('~' + pub + '/', '');
      console.log(pub, '~' + pub + '/', path);
      if (typeof v === 'string' && v.indexOf('data:image') === 0) {
        s = isMine ? html`<iris-img user=${pub} path=${path}/>` : html`<img src=${v}/>`;
      } else {
        //s = isMine && false ? html`<iris-text placeholder="empty" user=${pub} path=${path}/>` : JSON.stringify(v);
        s = JSON.stringify(v);
      }
    }
    return html`
      <div class="explorer-dir">
        <b>${k}</b>:
        ${encryption ? html`
          <span class="tooltip"><span class="tooltiptext">${encryption} value</span>
            ${decrypted ? '🔓' : ''}
          </span>
        ` : ''} ${s}
      </div>
    `;
  }

  onExpandClicked() {
    const expandAll = !this.state.expandAll;
    Object.keys(this.children).forEach(k => {
      this.children[k].open = expandAll;
    });
    this.setState({expandAll, children: this.children});
  }

  onNewItemSubmit() {
    if (this.state.newItemName) {
      this.getNode().get(this.state.newItemName.trim()).put(this.state.showNewItem === 'object' ? {a:null} : '');
      this.setState({showNewItem: false, newItemName: ''});
    }
  }

  onNewItemNameInput(e) {
    this.setState({newItemName: e.target.value.trimStart().replace('  ', ' ')});
  }

  showNewItemClicked(type) {
    this.setState({showNewItem:type});
    setTimeout(() => document.querySelector('#newItemNameInput').focus(), 0);
  }

  render() {
    return html`
      <div class="explorer-dir">
        ${this.props.showTools ? html`
          <p class="explorer-tools">
            <a onClick=${() => this.onExpandClicked()}>${this.state.expandAll ? 'Close all' : 'Expand all'}</a>
            <a onClick=${() => this.showNewItemClicked('object')}>New object</a>
            <a onClick=${() => this.showNewItemClicked('value')}>New value</a>
          </p>
        `: ''}
        ${this.state.showNewItem ? html`
          <p>
            <form onSubmit=${() => this.onNewItemSubmit()}>
              <input id="newItemNameInput" type="text" onInput=${e => this.onNewItemNameInput(e)} value=${this.state.newItemName} placeholder="New ${this.state.showNewItem} name"/>
              <button type="submit">Create</button>
              <button onClick=${() => this.setState({showNewItem: false})}>Cancel</button>
            </form>
          </p>
        ` : ''}
        ${Object.keys(this.state.children).sort().map(k => {
          const v = this.state.children[k].value;
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
