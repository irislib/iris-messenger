import BaseComponent from "../BaseComponent";
import Session from "../Session";
import Gun from "gun";
import {html} from "htm/preact";
import Name from "./Name";

const hashRegex = /^(?:[A-Za-z0-9+/]{4}){10}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)+$/;
const pubKeyRegex = /^[A-Za-z0-9\-\_]{40,50}\.[A-Za-z0-9\_\-]{40,50}$/;
const SHOW_CHILDREN_COUNT = 50;

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

class ExplorerNode extends BaseComponent {
  constructor() {
    super();
    this.children = {};
    this.state = {children: {}, shownChildrenCount: SHOW_CHILDREN_COUNT};
  }

  getNode() {
    if (this.props.path.length > 1) {
      let path = this.props.path;
      if (path.indexOf('Public/Users') === 0) {
        path = path.replace('/Users', '');
      }
      path = path.split('/');
      return path.slice(1).reduce((sum, current) => (current && sum.get(decodeURIComponent(current))) || sum, this.props.gun);
    }
    return this.props.gun;
  }

  shouldComponentUpdate() {
    return true;
  }

  componentDidMount() {
    this.isMine = this.props.path.indexOf(`Public/Users/~${  Session.getPubKey()}`) === 0;
    this.isGroup = this.props.path.indexOf('Group') === 0;
    this.isPublicRoot = this.props.path === 'Public';
    this.isUserList = this.props.path === 'Public/Users';

    this.children = {};
    if (this.props.children && typeof this.props.children === "object") {
      this.children = Object.assign(this.children, this.props.children);
    }
    if (this.isPublicRoot) {
      this.children = Object.assign(this.children, {
        '#':{value:{_:1}, displayName: "ContentAddressed"},
        Users:{value:{_:1}}
      });
    }
    this.setState({children: this.children, shownChildrenCount: SHOW_CHILDREN_COUNT});

    const cb = this.sub(
      async (v, k, c, e, from) => {
        if (k === '_') { return; }
        if (this.isPublicRoot && k.indexOf('~') === 0) { return; }
        if (this.isUserList && !k.substr(1).match(pubKeyRegex)) { return; }
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
        const prev = this.children[k] || {};
        this.children[k] = Object.assign(prev, { value: v, encryption, from });
        this.setState({children: this.children});
      }
    );

    if (this.isGroup) {
      const path = this.props.path.split('/').slice(2).join('/');
      this.props.gun.map(path, cb); // TODO: make State.group() provide the normal gun api
    } else {
      this.getNode().map().on(cb);
    }
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

  renderChildObject(k, displayName) {
    const path = `${this.props.path  }/${  encodeURIComponent(k)}`;
    return html`
      <div class="explorer-row" style="padding-left: ${this.props.indent}em">
        <span onClick=${e => this.onChildObjectClick(e, k)}>${this.state.children[k].open ? chevronDown : chevronRight}</span>
        <a href="/explorer/${encodeURIComponent(path)}">
            <b>
                ${typeof k === 'string' && k.substr(1).match(pubKeyRegex) ? html`<${Name} key=${k} pub=${k.substr(1)} placeholder="profile name"/>` : (displayName || k)}
            </b>
        </a>
      </div>
      ${this.state.children[k].open ? html`<${ExplorerNode} gun=${this.props.gun} indent=${this.props.indent + 1} key=${path} path=${path} isGroup=${this.props.isGroup}/>` : ''}
    `;
  }

  renderChildValue(k, v) {
    let s;
    const encryption = this.children[k].encryption;
    const from = this.children[k].from;
    const decrypted = encryption === 'Decrypted';
    const lnk = (href, text, cls) => html`<a class=${cls === undefined ? "mar-left5" : cls} href=${href}>${text}</a>`;
    const keyLinks = html`
      ${typeof k === 'string' && k.match(hashRegex) ? lnk(`/post/${encodeURIComponent(k)}`, '#') : ''}
      ${typeof k === 'string' && k.match(pubKeyRegex) ? lnk(`/explorer/Public%2F~${encodeURIComponent(encodeURIComponent(k))}`, html`<${Name} key=${k} pub=${k} placeholder="profile name"/>`) : ''}
    `;
    if (encryption) {
      if (!decrypted) {
        s = html`<i>Encrypted value</i>`;
      } else {
        s = JSON.stringify(v);
      }
    } else {
      const pub = Session.getPubKey();
      const isMine = this.props.path.indexOf(`Public/Users/~${  pub}`) === 0;
      const path = isMine && (`${this.props.path  }/${  encodeURIComponent(k)}`).replace(`Public/~${  pub  }/`, '');

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
          ${typeof v === 'string' && v.match(hashRegex) ? lnk(`/post/${encodeURIComponent(v)}`, '#') : ''}
          ${typeof v === 'string' && v.match(pubKeyRegex) ? lnk(`/explorer/Public%2F~${encodeURIComponent(encodeURIComponent(v))}`, html`<${Name} key=${v} pub=${v} placeholder="profile name"/>`) : ''}
          ${typeof from === 'string' ? html`<small> from ${lnk(`/explorer/Public%2F~${encodeURIComponent(encodeURIComponent(from))}`, html`<${Name} key=${from} pub=${from} placeholder="profile name"/>`, '')}</small>` : ''}
        `;

        s = isMine ? html`
          <iris-text placeholder="empty" key=${path} user=${pub} path=${path} editable=${true} json=${true}/>
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
    const children = Object.keys(this.state.children).sort();

    const renderChildren = children => {
      return children.map(k => {
        const v = this.state.children[k].value;
        const n = this.state.children[k].displayName;
        if (typeof v === 'object' && v && v['_']) {
          return this.renderChildObject(k, n);
        }
          return this.renderChildValue(k, v);

      });
    }

    const showMoreBtn = children.length > this.state.shownChildrenCount;
    return html`
      ${this.props.indent === 0 ? html`
        <div class="explorer-row" style="padding-left: ${this.props.indent}em">
          ${this.props.showTools ? html`
            <p class="explorer-tools">
              <a onClick=${() => this.onExpandClicked()}>${this.state.expandAll ? 'Close all' : 'Expand all'}</a>
              <a onClick=${() => this.showNewItemClicked('object')}>New object</a>
              <a onClick=${() => this.showNewItemClicked('value')}>New value</a>
              ${children.length} items
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
      ${renderChildren(children.slice(0, this.state.shownChildrenCount))}
      ${showMoreBtn ? html`
        <a style="padding-left: ${this.props.indent + 1}em" href="" onClick=${e => {e.preventDefault();this.setState({shownChildrenCount: this.state.shownChildrenCount + SHOW_CHILDREN_COUNT})}}>More (${children.length - this.state.shownChildrenCount})</a>
      ` : ''}
    `;
  }
}

export default ExplorerNode;