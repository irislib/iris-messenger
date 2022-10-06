import { html } from 'htm/preact';
import iris from 'iris-lib';
import View from './View';
import ExplorerNode from '../components/ExplorerNode';
import { translate as t } from '../translations/Translation';
import Name from '../components/Name';

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
    const scope = split.length && split[0];
    let gun = iris.public();
    if (scope === 'Local') {
      gun = iris.local();
    } else if (scope === 'Group') {
      const group = (split.length >= 2) && split[1];
      gun = iris.group(group || undefined);
    }
    const isRootLevel = !split[0].length;
    const pathString = split.map((k, i) => {
      k = decodeURIComponent(k);
      const substr = k.substr(1);
      const isPubKey = substr.match(pubKeyRegex);
      return html`
        ${chevronRight} <a href="/explorer/${encodeURIComponent(split.slice(0,i+1).join('/'))}">
            ${isPubKey ? html`<${Name} key=${substr} pub=${substr} placeholder="profile name" />` : k}
        </a>
        ${isPubKey ? html`<small> (<a href="/profile/${substr}">${t('profile')}</a>)</small>`: ''}
      `
    });
    const s = this.state;
    return html`
      <p>
        <a href="/explorer">All</a> ${split[0].length ? pathString : ''}
        ${isRootLevel ? html `<small class="mar-left5">Iris raw data.</small>` : ''}
      </p>
      ${isRootLevel ? html`
        <div class="explorer-row">
            <span onClick=${() => this.setState({publicOpen:!s.publicOpen})}>${s.publicOpen ? chevronDown : chevronRight}</span>
            <a href="/explorer/Public"><b>Public</b></a>
            <small class="mar-left5">(synced with peers)</small>
        </div>
        ${s.publicOpen ? html`<${ExplorerNode} indent=${1} gun=${iris.public()} key='Public' path='Public'/>`:''}
        <div class="explorer-row">
            <span onClick=${() => this.setState({groupOpen:!s.groupOpen})}>${s.groupOpen ? chevronDown : chevronRight}</span>
            <a href="/explorer/Group"><b>Group</b></a>
            <small class="mar-left5">(public data, composite object of all the users in the <a href="/explorer/Local%2Fgroups">group</a>)</small>
        </div>
        ${s.groupOpen ? html`<${ExplorerNode} indent=${1} gun=${iris.public()} key='Group' path='Group'/>`:''}
        <div class="explorer-row">
            <span onClick=${() => this.setState({localOpen:!s.localOpen})}>${s.localOpen ? chevronDown : chevronRight}</span>
            <a href="/explorer/Local"><b>Local</b></a>
            <small class="mar-left5">(only stored on your device)</small>
        </div>
        ${s.localOpen ? html`<${ExplorerNode} indent=${1} gun=${iris.local()} key="Local" path='Local'/>`:''}
      `: html`
        <${ExplorerNode} indent=${0} showTools=${true} gun=${gun} key=${this.props.node} path=${this.props.node}/>
      `}
    `;
  }
}

export default Explorer;
