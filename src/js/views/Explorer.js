import { html } from '../Helpers.js';
import State from '../State.js';
import Session from '../Session.js';
import { Component } from '../lib/preact.js';
import View from './View.js';

const hashRegex = /^(?:[A-Za-z0-9+/]{4}){10}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)+$/;
const pubKeyRegex = /^[A-Za-z0-9\-\_]{40,50}\.[A-Za-z0-9\_\-]{40,50}$/;

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

class Explorer extends View {
  renderView() {
    const split = (this.props.node || '').split('/');
    const gun = (split.length && split[0]) === 'local' ? State.local : State.public;
    const path = split.slice(1).join('/');
    const pathString = split.map((k, i) => html`
      ${chevronRight} <a href="#/explorer/${encodeURIComponent(split.slice(0,i+1).join('/'))}">${decodeURIComponent(k)}</a>
    `);
    return html`
      ${path ? '' : html `<p>Useful debug data for nerds.</p>`}
      <p>
        <a href="#/explorer">All</a> ${path ? pathString : ''}
      </p>
      ${path ? html`
        <${ExplorerNode} indent=${0} showTools=${true} gun=${gun} path=${this.props.node}/>
      ` : html`
        <div class="explorer-row">
          ${chevronDown} Public (synced with peers)
        </div>
        <div class="explorer-row" style="padding-left: 1em">
          ${chevronDown} Users
        </div>
        <div class="explorer-row" style="padding-left: 2em">
          ${chevronDown} <a href="#/explorer/public%2F~${encodeURIComponent(Session.getPubKey())}">${Session.getPubKey()}</a>
        </div>
        <${ExplorerNode} indent=${3} gun=${State.public} path='public/~${Session.getPubKey()}'/>
        <div class="explorer-row" style="padding-left: 1em">
          ${chevronRight} <a href="#/explorer/public%2F%23">#</a> (content-addressed values, such as public posts)
        </div>
        <br/><br/>
        <div class="explorer-row">
          ${chevronDown} Local (only stored on your device)
        </div>
        <${ExplorerNode} indent=${1} gun=${State.local} path='local'/>
      `}
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
    if (this.props.path.length > 1) {
      const path = this.props.path.split('/');
      return path.slice(1).reduce((sum, current) => (current && sum.get(decodeURIComponent(current))) || sum, this.props.gun);
    }
    return this.props.gun;
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
    this.isMine = this.props.path.indexOf('public/~' + Session.getPubKey()) === 0;
    this.getNode().map().on(async (v, k, c, e) => {
      if (k === '_') { return; }
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

  onShowMoreClick(e, k) {
    e.preventDefault();
    this.children[k].showMore = !this.children[k].showMore;
    this.setState({children: this.children});
  }

  renderChildObject(k) {
    const path = this.props.path + '/' + encodeURIComponent(k);
    return html`
      <div class="explorer-row" style="padding-left: ${this.props.indent}em">
        <span onClick=${e => this.onChildObjectClick(e, k)}>${this.state.children[k].open ? chevronDown : chevronRight}</span>
        <a href="#/explorer/${encodeURIComponent(path)}"><b>${k}</b></a>
      </div>
      ${this.state.children[k].open ? html`<${ExplorerNode} gun=${this.props.gun} indent=${this.props.indent + 1} path=${path}/>` : ''}
    `;
  }

  renderChildValue(k, v) {
    let s;
    const encryption = this.children[k].encryption;
    const decrypted = encryption === 'Decrypted';
    const lnk = (href, text) => html`<a class="mar-left5" href=${href}>${text}</a>`;
    const keyLinks = html`
      ${typeof k === 'string' && k.match(hashRegex) ? lnk(`#/post/${encodeURIComponent(k)}`, '#') : ''}
      ${typeof k === 'string' && k.match(pubKeyRegex) ? lnk(`#/explorer/public%2F~${encodeURIComponent(encodeURIComponent(k))}`, html`<iris-text user=${k} path="profile/name"/>`) : ''}
    `;
    if (encryption) {
      if (!decrypted) {
        s = html`<i>Encrypted value</i>`;
      } else {
        s = JSON.stringify(v);
      }
    } else {
      const pub = Session.getPubKey();
      const isMine = this.props.path.indexOf('public/~' + pub) === 0;
      const path = isMine && (this.props.path + '/' + encodeURIComponent(k)).replace('public/~' + pub + '/', '');
      if (typeof v === 'string' && v.indexOf('data:image') === 0) {
        s = isMine ? html`<iris-img user=${pub} path=${path}/>` : html`<img src=${v}/>`;
      } else {
        let stringified = JSON.stringify(v);
        let showToggle;
        if (stringified.length > 100) {
          showToggle = true;
          if (!this.state.children[k].showMore) {
            stringified = stringified.slice(0, 100);
          }
        }

        const valueLinks = html`
          ${typeof v === 'string' && v.match(hashRegex) ? lnk(`#/post/${encodeURIComponent(v)}`, '#') : ''}
          ${typeof v === 'string' && v.match(pubKeyRegex) ? lnk(`#/explorer/public%2F~${encodeURIComponent(encodeURIComponent(v))}`, html`<iris-text user=${v} path="profile/name"/>`) : ''}
        `;

        s = isMine ? html`
          <iris-text placeholder="empty" user=${pub} path=${path} editable=${true} json=${true}/>
          ${valueLinks}
        ` :
        html`
          <span class=${typeof v === 'string' ? '' : 'iris-non-string'}>
            ${stringified}
            ${showToggle ? html`
              <a onClick=${e => this.onShowMoreClick(e, k)} href="">${this.state.children[k].showMore ? 'less' : 'more'}</a>
            ` : ''}
            ${valueLinks}
          </span>
        `;
      }
    }
    return html`
      <div class="explorer-row" style="padding-left: ${this.props.indent}em">
        <b class="val">${k} ${keyLinks}</b>:
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

  onNewItemSubmit(e) {
    e.preventDefault();
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
      ${this.props.indent === 0 ? html`
        <div class="explorer-row" style="padding-left: ${this.props.indent}em">
          ${this.props.showTools ? html`
            <p class="explorer-tools">
              <a onClick=${() => this.onExpandClicked()}>${this.state.expandAll ? 'Close all' : 'Expand all'}</a>
              <a onClick=${() => this.showNewItemClicked('object')}>New object</a>
              <a onClick=${() => this.showNewItemClicked('value')}>New value</a>
            </p>
          `: ''}
          ${this.state.showNewItem ? html`
            <p>
              <form onSubmit=${(e) => this.onNewItemSubmit(e)}>
                <input id="newItemNameInput" type="text" onInput=${e => this.onNewItemNameInput(e)} value=${this.state.newItemName} placeholder="New ${this.state.showNewItem} name"/>
                <button type="submit">Create</button>
                <button onClick=${() => this.setState({showNewItem: false})}>Cancel</button>
              </form>
            </p>
          ` : ''}
        </div>
      `: ''}
      ${Object.keys(this.state.children).sort().map(k => {
        const v = this.state.children[k].value;
        if (typeof v === 'object' && v && v['_']) {
          return this.renderChildObject(k, v);
        } else {
          return this.renderChildValue(k, v);
        }
      })}
    `;
  }
}

export default Explorer;
