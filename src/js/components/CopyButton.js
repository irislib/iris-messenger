import { Component } from '../lib/preact.js';
import {html} from '../Helpers.js';
import {translate as t} from '../Translation.js';
import Helpers from '../Helpers.js';

class CopyButton extends Component {
  onClick(e) {
    e.preventDefault();
    const copyStr = typeof this.props.copyStr === 'function' ? this.props.copyStr() : this.props.copyStr;
    Helpers.copyToClipboard(copyStr);

    const tgt = $(e.target);
    this.originalWidth = this.originalWidth || tgt.width();
    tgt.width(this.originalWidth);

    this.setState({copied:true});
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.setState({copied:false}), 2000);
  }

  render() {
    const text = this.state.copied ? t('copied') : (this.props.text || t('copy'));
    return html`<button onClick=${e => this.onClick(e)}>${text}</button>`;
  }
}

export default CopyButton;
