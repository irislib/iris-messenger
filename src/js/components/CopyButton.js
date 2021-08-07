import { Component } from 'preact';
import Helpers from '../Helpers.js';
import { html } from 'htm/preact';
import {translate as t} from '../Translation.js';
import $ from 'jquery';
import iris from 'iris-lib';

class CopyButton extends Component {
  copy(e, copyStr) {
    Helpers.copyToClipboard(copyStr);

    const tgt = $(e.target);
    this.originalWidth = this.originalWidth || tgt.width() + 1;
    tgt.width(this.originalWidth);

    this.setState({copied:true});
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.setState({copied:false}), 2000);
  }

  onClick(e) {
    e.preventDefault();
    const copyStr = typeof this.props.copyStr === 'function' ? this.props.copyStr() : this.props.copyStr;

    if (navigator.share && iris.util.isMobile && !this.props.notShareable) {
      navigator.share({url: copyStr, title: this.props.title}).catch(err => {
        console.error('share failed', err);
        this.copy(e, copyStr);
      });
    } else {
      this.copy(e, copyStr);
    }
  }

  render() {
    const text = this.state.copied ? t('copied') : (this.props.text || t('copy'));
    return html`<button class="copy-button" onClick=${e => this.onClick(e)}>${text}</button>`;
  }
}

export default CopyButton;
